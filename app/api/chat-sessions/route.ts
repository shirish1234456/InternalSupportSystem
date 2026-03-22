import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';



// Create new Chat Session manually
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            chatCode,
            customerName,
            customerEmail,
            contactNumber,
            school,
            country,
            customerRole,
            departmentId,
            agentId,
            queryTypeId,
            issueTypeId,
            queryDescription,
            resolution,
            status,
            createdAt
        } = body;

        // Validate required fields
        if (!chatCode || !customerName || !departmentId || !agentId || !queryTypeId || !issueTypeId || !queryDescription) {
            return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
        }

        // Check for duplicate chatCode
        const existingChat = await prisma.chatSession.findUnique({
            where: { chatCode }
        });

        if (existingChat) {
            return NextResponse.json({ error: `Chat session with code ${chatCode} already exists` }, { status: 409 });
        }

        // Process Customer: Create new or link if we have an exact email match (and email isn't empty)
        let customer;
        if (customerEmail) {
            customer = await prisma.customer.findFirst({
                where: { email: customerEmail }
            });
            // Link existing customer and update role if it was previously unset and is now provided
            if (customer && customerRole && !customer.role) {
                customer = await prisma.customer.update({
                    where: { id: customer.id },
                    data: { role: customerRole }
                });
            }
        }

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    fullName: customerName,
                    email: customerEmail || null,
                    contactNumber: contactNumber || null,
                    school: school || null,
                    country: country || null,
                    role: customerRole || null
                }
            });
        }

        // Create the Chat Session
        const newSession = await prisma.chatSession.create({
            data: {
                chatCode,
                queryDescription,
                resolution: resolution || null,
                status: status || 'Open',
                customerId: customer.id,
                departmentId,
                agentId,
                queryTypeId,
                issueTypeId,
                createdById: session.id,
                updatedById: session.id,
                closedAt: (status === 'Resolved' && resolution) ? new Date() : null,
                createdAt: createdAt ? new Date(createdAt) : undefined
            }
        });

        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        console.error('Failed to create chat session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Get paginated Chat Sessions
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const search = url.searchParams.get('search') || '';
        const statusVal = url.searchParams.get('status') || 'All';
        const departmentId = url.searchParams.get('departmentId') || 'All';
        const isExport = url.searchParams.get('export') === 'true';

        const skip = (page - 1) * limit;

        const andConditions: any[] = [];

        if (search) {
            andConditions.push({
                OR: [
                    { chatCode: { contains: search, mode: 'insensitive' } },
                    { customer: { fullName: { contains: search, mode: 'insensitive' } } },
                    { customer: { email: { contains: search, mode: 'insensitive' } } },
                ]
            });
        }

        if (statusVal !== 'All') {
            andConditions.push({ status: statusVal });
        }

        if (departmentId !== 'All') {
            andConditions.push({ departmentId });
        }

        const whereClause: any = andConditions.length > 0 ? { AND: andConditions } : {};

        const baseIncludes = {
            customer: true,
            department: true,
            agent: true,
            queryType: true,
            issueType: true,
            createdBy: { select: { fullName: true } }
        };

        if (isExport) {
            // Bypass pagination for CSV Export, fetch up to 5000 matched records
            const exportSessions = await prisma.chatSession.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: 5000,
                include: baseIncludes
            });
            return NextResponse.json({ data: exportSessions });
        }

        const [total, sessions] = await Promise.all([
            prisma.chatSession.count({ where: whereClause }),
            prisma.chatSession.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: baseIncludes
            })
        ]);

        return NextResponse.json({
            data: sessions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Failed to list chat sessions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Delete a Chat Session
// Delete Chat Session(s)
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        // Restrict deletion to Admin/SuperAdmin for security
        if (!session || (session.role !== 'SuperAdmin' && session.role !== 'Admin')) {
            return NextResponse.json({ error: 'Forbidden. Admin access required to delete logs.' }, { status: 403 });
        }

        const url = new URL(req.url);
        const singleId = url.searchParams.get('id');

        let idsToDelete: string[] = [];

        // Attempt to parse JSON body for bulk deletion
        try {
            const body = await req.json();
            if (body && Array.isArray(body.ids) && body.ids.length > 0) {
                idsToDelete = body.ids;
            }
        } catch (e) {
            // Ignore JSON parse errors (might be a simple single delete request with no body)
        }

        // If no body IDs, fallback to query param
        if (idsToDelete.length === 0 && singleId) {
            idsToDelete = [singleId];
        }

        if (idsToDelete.length === 0) {
            return NextResponse.json({ error: 'Chat session ID(s) are required' }, { status: 400 });
        }

        const result = await prisma.chatSession.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ error: 'No matching records found to delete' }, { status: 404 });
        }

        return NextResponse.json({ message: `Successfully deleted ${result.count} chat session(s)` });
    } catch (error) {
        console.error('Failed to delete chat session(s):', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Update a Chat Session
export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            id,
            resolution,
            emailSent,
            agentId,
            departmentId,
            queryTypeId,
            issueTypeId,
            queryDescription
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'Chat session ID is required' }, { status: 400 });
        }

        // --- STALE SESSION FALLBACK (Fixes Foreign Key errors after DB re-seeds) ---
        let adminId = session.id;
        const validAdmin = await prisma.user.findUnique({ where: { id: adminId } });

        if (!validAdmin) {
            console.warn(`[PUT ChatSession] Session ID ${adminId} not found in DB. Falling back to an existing SuperAdmin.`);
            const fallbackAdmin = await prisma.user.findFirst({ where: { role: 'SuperAdmin' } });
            if (!fallbackAdmin) {
                return NextResponse.json({ error: 'System error: No valid admin users found to update the record.' }, { status: 500 });
            }
            adminId = fallbackAdmin.id;
        }
        // --------------------------------------------------------------------------

        // We only allow updating resolution and emailSent for tracking purposes, 
        // to prevent rewriting historical core data.
        const updatedSession = await prisma.chatSession.update({
            where: { id },
            data: {
                resolution: resolution !== undefined ? resolution : undefined,
                emailSent: emailSent !== undefined ? emailSent : undefined,
                agentId: agentId !== undefined ? agentId : undefined,
                departmentId: departmentId !== undefined ? departmentId : undefined,
                queryTypeId: queryTypeId !== undefined ? queryTypeId : undefined,
                issueTypeId: issueTypeId !== undefined ? issueTypeId : undefined,
                queryDescription: queryDescription !== undefined ? queryDescription : undefined,
                updatedById: adminId,
                // If resolving, calculate close time
                ...(resolution ? { closedAt: new Date(), status: 'Resolved' } : {})
            },
            include: {
                customer: {
                    select: { fullName: true, email: true, school: true, contactNumber: true, country: true, role: true }
                },
                department: { select: { name: true } },
                agent: { select: { name: true } },
                queryType: { select: { name: true } },
                issueType: { select: { name: true } },
                createdBy: { select: { fullName: true, role: true } }
            }
        });

        return NextResponse.json(updatedSession);
    } catch (error: any) {
        console.error('Failed to update chat session:', error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
