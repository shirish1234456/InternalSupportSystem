import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';



export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const startDateParam = url.searchParams.get('startDate');
        const endDateParam = url.searchParams.get('endDate');
        const tzOffset = parseInt(url.searchParams.get('tzOffset') || '0'); // minutes east of UTC (e.g. Nepal = 345)
        const isAllTime = url.searchParams.get('allTime') === 'true';

        let startDate = startDateParam ? new Date(startDateParam) : new Date();
        let endDate = endDateParam ? new Date(endDateParam) : new Date();

        if (isAllTime) {
            const bounds = await prisma.chatSession.aggregate({
                _min: { createdAt: true },
                _max: { createdAt: true }
            });
            startDate = bounds._min.createdAt || new Date(2000, 0, 1);
            // Use a far-future date so ALL records (even those with bad import dates) are included in counts
            endDate = new Date(9999, 11, 31);
        } else if (!startDateParam) {
            startDate.setDate(startDate.getDate() - 30);
        }

        const dateFilter = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        // 1. Top Level Metrics
        const [
            totalChats,
            openChats,
            resolvedChats,
            escalatedChats,
            totalEmailsRaw // this comes from EmailLogs - but we also want emails Sent from chat sessions
        ] = await Promise.all([
            prisma.chatSession.count({ where: dateFilter }),
            prisma.chatSession.count({ where: { ...dateFilter, status: 'Open' } }),
            prisma.chatSession.count({ where: { ...dateFilter, status: 'Resolved' } }),
            prisma.chatSession.count({ where: { ...dateFilter, status: 'Escalated' } }),
            prisma.emailLog.count({ where: { sentAt: { gte: startDate, lte: endDate } } })
        ]);

        // 2. Department Distribution
        const deptDistribution = await prisma.chatSession.groupBy({
            by: ['departmentId'],
            where: dateFilter,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });

        // Enricht dept names
        const depts = await prisma.department.findMany({ select: { id: true, name: true } });
        const deptMap = new Map(depts.map((d: any) => [d.id, d.name]));
        const departmentChart = deptDistribution.map((d: any) => ({
            name: deptMap.get(d.departmentId) || 'Unknown',
            value: d._count.id
        }));

        // 3. Top Issue Types (Segmented by Department)
        const issueDist = await prisma.chatSession.groupBy({
            by: ['departmentId', 'issueTypeId'],
            where: dateFilter,
            _count: { id: true },
        });

        const issues = await prisma.issueType.findMany({ select: { id: true, name: true } });
        const issueMap = new Map(issues.map((i: any) => [i.id, i.name]));

        const topIssuesMap = new Map<string, Map<string, number>>();
        topIssuesMap.set('All Departments', new Map<string, number>());
        depts.forEach((d: any) => topIssuesMap.set(d.name, new Map<string, number>()));

        issueDist.forEach((i: any) => {
            const issueName = issueMap.get(i.issueTypeId) || 'Unknown';
            const deptName = deptMap.get(i.departmentId) || 'Unknown';
            const count = i._count.id;

            // Add to All Departments
            const allMap = topIssuesMap.get('All Departments')!;
            allMap.set(issueName, (allMap.get(issueName) || 0) + count);

            // Add to Specific Department
            if (topIssuesMap.has(deptName)) {
                const deptMapObj = topIssuesMap.get(deptName)!;
                deptMapObj.set(issueName, (deptMapObj.get(issueName) || 0) + count);
            }
        });

        const topIssuesSegmented = Array.from(topIssuesMap.entries()).map(([deptName, counts]) => ({
            departmentName: deptName,
            data: Array.from(counts.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
        })).filter(dept => dept.departmentName === 'All Departments' || dept.data.length > 0);

        // 4. Agent Performance (Segmented by Department)
        const agentDist = await prisma.chatSession.groupBy({
            by: ['departmentId', 'agentId'],
            where: dateFilter,
            _count: { id: true },
        });

        const agents = await prisma.agent.findMany({ select: { id: true, name: true } });
        const agentMap = new Map(agents.map((a: any) => [a.id, a.name]));

        const topAgentsMap = new Map<string, Map<string, number>>();
        topAgentsMap.set('All Departments', new Map<string, number>());
        depts.forEach((d: any) => topAgentsMap.set(d.name, new Map<string, number>()));

        agentDist.forEach((a: any) => {
            const agentName = agentMap.get(a.agentId) || 'Unknown';
            const deptName = deptMap.get(a.departmentId) || 'Unknown';
            const count = a._count.id;

            // Add to All Departments
            const allMap = topAgentsMap.get('All Departments')!;
            allMap.set(agentName, (allMap.get(agentName) || 0) + count);

            // Add to Specific Department
            if (topAgentsMap.has(deptName)) {
                const deptMapObj = topAgentsMap.get(deptName)!;
                deptMapObj.set(agentName, (deptMapObj.get(agentName) || 0) + count);
            }
        });

        const topAgentsSegmented = Array.from(topAgentsMap.entries()).map(([deptName, counts]) => ({
            departmentName: deptName,
            data: Array.from(counts.entries())
                .map(([name, chatsHandled]) => ({ name, chatsHandled }))
                .sort((a, b) => b.chatsHandled - a.chatsHandled)
        })).filter(dept => dept.departmentName === 'All Departments' || dept.data.length > 0);

        // 5. Volume Trend by Department
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const groupByMonth = diffDays > 60;

        // Fetch chats for the whole selected date range to calculate hourly spikes, emails sent, and trends
        const allPeriodChats = await prisma.chatSession.findMany({
            where: dateFilter,
            select: { createdAt: true, closedAt: true, status: true, emailSent: true, departmentId: true, customer: { select: { country: true } } }
        });

        // Initialize maps for all departments + "All Departments" wrapper
        const deptTrendMaps = new Map<string, Map<string, number>>();
        deptTrendMaps.set('All Departments', new Map<string, number>());
        depts.forEach((d: any) => {
            deptTrendMaps.set(d.name, new Map<string, number>());
        });

        // Cap timeKeys to today so future months never appear regardless of bad DB dates
        const now = new Date();
        const todayKey = groupByMonth
            ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            : now.toISOString().split('T')[0];

        // Pre-fill time gaps based on grouping, stopping at today
        const timeKeys: string[] = [];
        if (groupByMonth) {
            let curr = new Date(startDate);
            curr.setDate(1); // align to month start
            while (curr <= now && (curr.getFullYear() < now.getFullYear() || curr.getMonth() <= now.getMonth())) {
                const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
                timeKeys.push(key);
                curr.setMonth(curr.getMonth() + 1);
            }
        } else {
            let curr = new Date(startDate);
            while (curr <= now) {
                const key = curr.toISOString().split('T')[0];
                timeKeys.push(key);
                curr.setDate(curr.getDate() + 1);
            }
        }

        // Initialize 0s
        for (const deptKeys of deptTrendMaps.values()) {
            timeKeys.forEach(k => deptKeys.set(k, 0));
        }

        const hourlyMap = new Array(24).fill(0);

        allPeriodChats.forEach((chat: any) => {
            let dateKey = '';
            if (groupByMonth) {
                dateKey = `${chat.createdAt.getFullYear()}-${String(chat.createdAt.getMonth() + 1).padStart(2, '0')}`;
            } else {
                dateKey = chat.createdAt.toISOString().split('T')[0];
            }

            const deptName = deptMap.get(chat.departmentId) || 'Unknown';

            // Convert UTC time to local hour using the client's timezone offset
            const utcMinutes = chat.createdAt.getUTCHours() * 60 + chat.createdAt.getUTCMinutes();
            const localMinutes = ((utcMinutes + tzOffset) + 1440) % 1440;
            const localHour = Math.floor(localMinutes / 60);
            hourlyMap[localHour]++;

            // Skip future-dated records from the trend chart
            if (dateKey > todayKey) return;

            // Increment All Departments trend
            const allMap = deptTrendMaps.get('All Departments')!;
            if (allMap.has(dateKey)) {
                allMap.set(dateKey, allMap.get(dateKey)! + 1);
            }

            // Increment Specific Department trend
            if (deptTrendMaps.has(deptName)) {
                const specificMap = deptTrendMaps.get(deptName)!;
                if (specificMap.has(dateKey)) {
                    specificMap.set(dateKey, specificMap.get(dateKey)! + 1);
                }
            }
        });

        // Convert Map entries to Final Array
        const departmentTrends = Array.from(deptTrendMaps.entries()).map(([deptName, trendMap]) => ({
            departmentName: deptName,
            trend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }))
        })).filter(dept => dept.departmentName === 'All Departments' || dept.trend.some(t => t.count > 0)); // Filter empty departments

        const chatSpikes = hourlyMap.map((count, index) => ({
            hour: `${index.toString().padStart(2, '0')}:00`,
            count
        }));

        // Calculate Emails Sent by Department
        const emailSentByDeptMap = new Map<string, number>();
        const countryMap = new Map<string, number>();
        let totalEmailsSent = 0;

        allPeriodChats.forEach((chat: any) => {
            if (chat.emailSent) {
                totalEmailsSent++;
                const deptName = deptMap.get(chat.departmentId) || 'Unknown';
                if (!emailSentByDeptMap.has(deptName)) {
                    emailSentByDeptMap.set(deptName, 0);
                }
                emailSentByDeptMap.set(deptName, emailSentByDeptMap.get(deptName)! + 1);
            }

            const country = chat.customer?.country || 'Unknown';
            countryMap.set(country, (countryMap.get(country) || 0) + 1);
        });

        const emailsSentByDept = Array.from(emailSentByDeptMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const sortedCountries = Array.from(countryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        let chatsByCountry = sortedCountries;
        if (sortedCountries.length > 5) {
            const top5 = sortedCountries.slice(0, 5);
            const othersCount = sortedCountries.slice(5).reduce((acc, curr) => acc + curr.value, 0);
            chatsByCountry = [...top5, { name: 'Other', value: othersCount }];
        }

        return NextResponse.json({
            summary: {
                totalChats,
                openChats,
                resolvedChats,
                escalatedChats,
                totalEmailsRaw,
                totalEmailsSent,
                resolutionRate: totalChats > 0 ? Math.round((resolvedChats / totalChats) * 100) : 0,
            },
            charts: {
                departmentDistribution: departmentChart,
                topIssuesSegmented,
                topAgentsSegmented,
                departmentTrends,
                chatSpikes,
                emailsSentByDept,
                chatsByCountry
            }
        });

    } catch (error) {
        console.error('Failed to fetch analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
