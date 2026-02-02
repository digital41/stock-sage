import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SageStockService } from '@/services/sage-stock.service';

// GET /api/depots/[code]/stock - Stock d'un dépôt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé' },
      { status: 401 }
    );
  }

  const { code } = await params;
  const depotCode = parseInt(code);

  if (isNaN(depotCode)) {
    return NextResponse.json(
      { success: false, error: 'Code dépôt invalide' },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const hasStock = searchParams.get('hasStock') !== 'false';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  try {
    // Vérifier que le dépôt existe
    const depot = await SageStockService.getDepotByCode(depotCode);
    if (!depot) {
      return NextResponse.json(
        { success: false, error: 'Dépôt non trouvé' },
        { status: 404 }
      );
    }

    const result = await SageStockService.getDepotStock(depotCode, {
      search,
      hasStock,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      depot,
      ...result,
    });
  } catch (error) {
    console.error('Erreur API depot stock:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
