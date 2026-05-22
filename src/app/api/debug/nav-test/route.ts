import { NextResponse } from 'next/server';
import { getNavItemsForRole } from '@/lib/navigation';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }
  const hroItems = getNavItemsForRole('HRO');

  return NextResponse.json({
    success: true,
    data: {
      role: 'HRO',
      totalItems: hroItems.length,
      items: hroItems.map(item => ({
        title: item.title,
        href: item.href,
        hasChildren: !!item.children,
      })),
      hasAddEmployee: hroItems.some(item => item.title === 'Add Employee'),
      addEmployeeItem: hroItems.find(item => item.title === 'Add Employee'),
    }
  });
}
