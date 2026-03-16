import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';



export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data: any[] = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'The uploaded file is empty' }, { status: 400 });
        }

        // Prefetch Master Data to map strings to UUIDs
        const [departments, agents, queryTypes, issueTypes] = await Promise.all([
            prisma.department.findMany(),
            prisma.agent.findMany(),
            prisma.queryType.findMany(),
            prisma.issueType.findMany(),
        ]);

        const deptMap = new Map(departments.map((d: any) => [d.name.toLowerCase().trim(), d.id]));
        const agentMap = new Map(agents.map((a: any) => [a.name.toLowerCase().trim(), a.id]));
        const qtMap = new Map(queryTypes.map((q: any) => [q.name.toLowerCase().trim(), q.id]));
        const itMap = new Map(issueTypes.map((i: any) => [i.name.toLowerCase().trim(), i.id]));

        let inserted = 0;
        let failed = 0;
        const errors: string[] = [];

        // Begin processing rows
        for (const [index, row] of data.entries()) {
            const rowNum = index + 2; // +1 for 0-index, +1 for header

            try {
                // Expected Columns (Adjust these based on standard template & History.xlsx)
                const visitorId = row['Visitor ID'] || row['VISITOR ID'] ? String(row['Visitor ID'] || row['VISITOR ID']) : null;
                // Use Visitor ID instead of Conversation ID for the unique Chat Code identifier
                const chatCode = String(row['Chat ID'] || visitorId || row['Conversation ID'] || '');

                // 1. Raw Extraction
                const rawAgentName = String(row['AGENT'] || row['Attender'] || '').toLowerCase().trim();

                // 2. Identity Mapping ('Support Team' -> 'agent', otherwise 'bot')
                const agentName = rawAgentName === 'support team' ? 'agent' : 'bot';

                const deptName = String(row['PROPERTY'] || row['Department'] || '').toLowerCase().trim();
                const rqType = String(row['TYPE'] || 'Queries').toLowerCase().trim(); // Hardcode to 'Queries' for history.xlsx
                const riType = String(row['ISSUE'] || row['Question'] || '').toLowerCase().trim(); // Use Question for issue type
                const customerName = String(row['FULL NAME'] || row['Name'] || '');
                const emailRaw = row['EMAIL ADDRESS'] || row['Email Address'];
                const email = emailRaw ? String(emailRaw) : null;
                // Read "Replied via email" directly (don't use || which skips boolean false)
                const repliedViaEmailRaw = row['Replied via email'];
                const lastEmailSentRaw = row['Last Email Sent Time'];

                // Determine emailSentRaw — prefer "Replied via email" if the column is present at all
                const emailSentRaw = (repliedViaEmailRaw !== undefined && repliedViaEmailRaw !== null)
                    ? String(repliedViaEmailRaw).toLowerCase().trim()
                    : String(lastEmailSentRaw || '').toLowerCase().trim();

                // Determine `emailSent` State
                // Blank, "false", "0", or "no" → NOT sent
                // "true", "1", "yes", or a date string → sent
                // Attender Email present → sent (history.xlsx compat) ONLY if not explicitly false above
                const attenderEmail = row['Attender Email'] || row['ATTENDER EMAIL'] || null;
                const isExplicitlyFalse = emailSentRaw === '' || emailSentRaw === 'false' || emailSentRaw === '0' || emailSentRaw === 'no';
                const emailSent = !isExplicitlyFalse && (
                    !!attenderEmail ||
                    emailSentRaw === '1' ||
                    emailSentRaw === 'yes' ||
                    emailSentRaw === 'true' ||
                    emailSentRaw.includes('/')
                );

                const rawRole = row['Role'] || row['ROLE'] ? String(row['Role'] || row['ROLE']).trim() : null;

                // Map shorthand role codes from standard.xlsx to full labels
                const roleCodeMap: Record<string, string> = {
                    's': 'Student',
                    'student': 'Student',
                    't': 'Teacher',
                    'teacher': 'Teacher',
                    'p': 'Parent',
                    'parent': 'Parent',
                    'n/a': 'N/A',
                };
                const role = rawRole
                    ? (roleCodeMap[rawRole.toLowerCase()] ?? rawRole)
                    : null;


                if (!chatCode || chatCode === 'undefined') throw new Error('Missing Chat ID or Conversation ID');
                if (!agentName || !agentMap.has(agentName)) throw new Error(`Agent '${row['AGENT'] || row['Attender']}' not found in system`);
                if (!deptName || !deptMap.has(deptName)) throw new Error(`Department '${row['PROPERTY'] || row['Department']}' not found in system`);

                let queryTypeId = qtMap.get(rqType);
                if (!queryTypeId && rqType) {
                    // Upsert it on the fly to avoid Unique Constraint failures
                    const actualName = row['TYPE'] || 'Queries';
                    const newQt = await prisma.queryType.upsert({
                        where: { name: String(actualName) },
                        update: {},
                        create: { name: String(actualName) }
                    });
                    queryTypeId = newQt.id;
                    qtMap.set(rqType, queryTypeId);
                } else if (!queryTypeId && qtMap.size > 0) {
                    queryTypeId = Array.from(qtMap.values())[0]; // fallback to first
                }
                if (!queryTypeId) throw new Error(`Query Type mapping failed and no fallback available`);

                let issueTypeId = itMap.get(riType);
                if (!issueTypeId && riType) {
                    // Upsert it on the fly to avoid Unique Constraint failures on duplicate unseen types
                    const actualName = row['ISSUE'] || row['Question'] || riType;
                    const newIt = await prisma.issueType.upsert({
                        where: { name: String(actualName) },
                        update: {},
                        create: { name: String(actualName) }
                    });
                    issueTypeId = newIt.id;
                    itMap.set(riType, issueTypeId);
                } else if (!issueTypeId && itMap.size > 0) {
                    issueTypeId = Array.from(itMap.values())[0]; // fallback to first
                }
                if (!issueTypeId) throw new Error(`Issue Type mapping failed and no fallback available`);

                if (!customerName || customerName === 'undefined') throw new Error('Missing FULL NAME or Name');

                // Note: In an enterprise setting, if rows are too large, consider a raw SQL bulk insert or prisma.createMany
                // However, because we need to upsert customers first, we loop.

                // 1. Check if chat code exists
                const existingChat = await prisma.chatSession.findUnique({
                    where: { chatCode }
                });

                if (existingChat) {
                    throw new Error(`Duplicate Chat Code: ${chatCode}`);
                }

                // 2. Resolve Customer
                let customer: any; // Use any or Prisma's exact type to bypass strict findFirst inference which may omit nullable properties if not heavily genericized
                if (email) {
                    customer = await prisma.customer.findFirst({ where: { email } });
                }
                if (!customer) {
                    customer = await prisma.customer.create({
                        data: {
                            visitorId,
                            fullName: customerName,
                            email: email,
                            contactNumber: row['Phone Number'] ? String(row['Phone Number']) : null,
                            school: row['SCHOOL/COLLEGE'] ? String(row['SCHOOL/COLLEGE']) : null,
                            country: (row['COUNTRY'] || row['Country/Region']) ? String(row['COUNTRY'] || row['Country/Region']) : null,
                            role: role
                        }
                    });
                } else if ((visitorId && !customer.visitorId) || (role && !customer.role)) {
                    // Optionally, try updating the user if they were found but lack the new fields
                    await prisma.customer.update({
                        where: { id: customer.id },
                        data: {
                            ...(visitorId && !customer.visitorId && { visitorId }),
                            ...(role && !customer.role && { role })
                        }
                    })
                }

                // 3. Create Session
                const resolutionText = row['RESOLUTION'] || row['Status'] ? String(row['RESOLUTION'] || row['Status']) : null;
                const status = resolutionText ? 'Resolved' : 'Open';

                // Attempt to combine Date and TIME columns from the Excel file
                let combinedDate = new Date();
                try {
                    const dateVal = row['Date'] || row['Date '] || row['DATE'] || row['Created Time'];
                    // Look for a separate TIME column (common in standard.xlsx)
                    const timeVal = row['Time'] || row['TIME'] || row['time'] || null;

                    if (dateVal) {
                        if (typeof dateVal === 'number') {
                            // Excel serial date → JS Date (excel epoch is Jan 1 1900, JS epoch is Jan 1 1970)
                            // The integer part is the date, the fractional part is the time-of-day
                            const dateSerial = Math.floor(dateVal);
                            const datePart = new Date(Math.round((dateSerial - 25569) * 86400 * 1000));

                            // Time can come from: fractional part of dateVal, a separate numeric serial, or a "HH:MM" string
                            let totalMs = datePart.getTime();

                            if (timeVal !== null && timeVal !== undefined) {
                                if (typeof timeVal === 'number') {
                                    // Fractional serial: 0.5 = 12:00:00, multiply by ms in a day
                                    totalMs += Math.round(timeVal * 86400 * 1000);
                                } else if (typeof timeVal === 'string' && timeVal.includes(':')) {
                                    // "HH:MM" or "HH:MM:SS" string
                                    const tParts = timeVal.trim().split(':');
                                    const hours = parseInt(tParts[0] || '0', 10);
                                    const minutes = parseInt(tParts[1] || '0', 10);
                                    const seconds = parseInt(tParts[2] || '0', 10);
                                    totalMs += (hours * 3600 + minutes * 60 + seconds) * 1000;
                                }
                            } else if (dateVal % 1 !== 0) {
                                // Fractional part of dateVal itself carries the time
                                const timeFraction = dateVal - dateSerial;
                                totalMs += Math.round(timeFraction * 86400 * 1000);
                            }

                            combinedDate = new Date(totalMs);

                        } else if (typeof dateVal === 'string' && dateVal.includes('/')) {
                            // Try to parse "DD/MM/YYYY HH:mm:ss" like history.xlsx often uses
                            const parts = dateVal.split(' ');
                            if (parts[0].includes('/')) {
                                const dParts = parts[0].split('/');
                                if (dParts.length === 3) {
                                    // User confirmed format is DD/MM/YYYY
                                    const day = dParts[0].padStart(2, '0');
                                    const month = dParts[1].padStart(2, '0');
                                    let year = dParts[2];
                                    if (year.length === 2) {
                                        year = '20' + year; // assume 20xx
                                    }
                                    const timeStr = parts[1] || (timeVal ? String(timeVal) : '00:00:00');
                                    // Parse without Z suffix so it's interpreted as local time
                                    combinedDate = new Date(`${year}-${month}-${day}T${timeStr}`);
                                    if (isNaN(combinedDate.getTime())) {
                                        combinedDate = new Date(dateVal); // ultimate fallback
                                    }
                                } else {
                                    combinedDate = new Date(dateVal);
                                }
                            } else {
                                combinedDate = new Date(dateVal);
                            }
                        } else {
                            combinedDate = new Date(dateVal);
                        }
                    }
                } catch (e) {
                    // fallback to current date
                }


                // Find a valid user to assign as the creator (fallback to session ID if strictly verified, or first admin)
                // Since this was a newly seeded database, the session UI cookie might contain an old UUID
                let systemUserId = session.id;
                const verifyUser = await prisma.user.findUnique({ where: { id: systemUserId } });
                if (!verifyUser) {
                    const fallbackAdmin = await prisma.user.findFirst({ where: { role: 'SuperAdmin' } });
                    if (fallbackAdmin) {
                        systemUserId = fallbackAdmin.id;
                    }
                }

                await prisma.chatSession.create({
                    data: {
                        chatCode,
                        queryDescription: String(row['QUERY DESCRIPTION'] || row['Question'] || 'No description provided'),
                        resolution: resolutionText,
                        status,
                        customerId: customer.id,
                        departmentId: deptMap.get(deptName)!,
                        agentId: agentMap.get(agentName)!,
                        queryTypeId: queryTypeId as string,
                        issueTypeId: issueTypeId as string,
                        emailSent: emailSent,
                        emailSentAt: emailSent ? combinedDate : null,
                        createdById: systemUserId,
                        updatedById: systemUserId,
                        createdAt: combinedDate,
                    }
                });

                inserted++;
            } catch (err: any) {
                failed++;
                errors.push(`Row ${rowNum}: ${err.message}`);
            }
        }

        return NextResponse.json({
            summary: {
                total: data.length,
                inserted,
                failed
            },
            errors
        });

    } catch (error) {
        console.error('Failed to import Excel:', error);
        return NextResponse.json({ error: 'Internal Server Error while parsing the file' }, { status: 500 });
    }
}
