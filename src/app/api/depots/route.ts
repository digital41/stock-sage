import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SageStockService } from '@/services/sage-stock.service';

// GET /api/depots - Liste des dépôts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    const depots = await SageStockService.getDepotsWithStats();

    return NextResponse.json({
      success: true,
      data: depots,
    });
  } catch (error) {
    console.error('Erreur API depots:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
