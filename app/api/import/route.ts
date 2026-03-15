import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as Blob;

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  let successCount = 0;
  let errors = [];

  // Get a default system admin
  const adminUser = await prisma.user.findFirst({ where: { role: 'SuperAdmin' } });
  const adminId = adminUser?.id || 'default-admin-id';

  for (const row of data as any[]) {
    try {
      // Find or create Customer
      const customerName = row['FULL NAME'] || 'Unknown Customer';
      let customer = await prisma.customer.findFirst({ where: { fullName: customerName } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName: customerName,
            school: row['SCHOOL/COLLEGE'] || null,
          }
        });
      }

      // Find or create QueryType
      const queryName = row['QUERY DESCRIPTION'] || 'General';
      let queryType = await prisma.queryType.findFirst({ where: { name: queryName } });
      if (!queryType) {
        queryType = await prisma.queryType.create({ data: { name: queryName } });
      }

      // Find or create IssueType 
      let issueType = await prisma.issueType.findFirst({ where: { name: 'Support' } });
      if (!issueType) {
        issueType = await prisma.issueType.create({ data: { name: 'Support' } });
      }

      // Find Agent
      const agent = await prisma.agent.findFirst({ where: { name: row.AGENT } });

      const departmentId = agent?.departmentId || (await prisma.department.findFirst())?.id || 'default-dept-id';

      await prisma.chatSession.create({
        data: {
          chatCode: row['Chat ID']?.toString() || `LEGACY-${Date.now()}-${Math.random()}`,
          queryDescription: queryName,
          resolution: row.RESOLUTION || null,
          status: row.STATUS === 'Resolved' ? 'Resolved' : 'Open',
          agentId: agent?.id || 'default-agent-id', // Needs to be real
          departmentId: departmentId,
          customerId: customer.id,
          queryTypeId: queryType.id,
          issueTypeId: issueType.id,
          createdById: adminId,
          updatedById: adminId,
        }
      });
      successCount++;
    } catch (err: any) {
      errors.push({ row: row['Chat ID'], error: err.message });
    }
  }

  return NextResponse.json({ successCount, errors });
}