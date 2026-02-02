import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SageStockService } from '@/services/sage-stock.service';

// GET /api/articles/[reference]/stock - Stock par dépôt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé' },
      { status: 401 }
    );
  }

  const { reference } = await params;

  if (!reference) {
    return NextResponse.json(
      { success: false, error: 'Référence manquante' },
      { status: 400 }
    );
  }

  try {
    const article = await SageStockService.getArticleDetail(decodeURIComponent(reference));

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: article.reference,
        designation: article.designation,
        stockTotal: article.stockTotal,
        stockDisponible: article.stockDisponible,
        stockParDepot: article.stockParDepot,
      },
    });
  } catch (error) {
    console.error('Erreur API article stock:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
