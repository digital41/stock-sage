import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SageStockService } from '@/services/sage-stock.service';

// GET /api/articles - Liste des articles avec stock
export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const famille = searchParams.get('famille') || undefined;
  const hasStock = searchParams.get('hasStock') === 'true';
  const gennevilliersOnly = searchParams.get('gennevilliersOnly') === 'true';
  const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  try {
    const result = await SageStockService.getArticlesWithStock({
      search,
      famille,
      hasStock,
      gennevilliersOnly,
      lowStockOnly,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erreur API articles:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
