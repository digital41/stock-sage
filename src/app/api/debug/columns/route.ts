import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSqlPool } from '@/lib/sage-db';

export async function GET() {
  // Route debug: uniquement en developpement OU pour les admins
  const session = await getServerSession(authOptions);

  if (process.env.NODE_ENV === 'production') {
    // En production, seuls les admins peuvent acceder
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acces refuse - Route debug reservee aux administrateurs' },
        { status: 403 }
      );
    }
  }

  try {
    const pool = await getSqlPool();
    if (!pool) {
      return NextResponse.json({ error: 'Connexion Sage indisponible' }, { status: 500 });
    }

    // Lister TOUTES les colonnes de F_ARTICLE
    const allColumnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'F_ARTICLE'
      ORDER BY COLUMN_NAME
    `);

    // Lister TOUTES les colonnes de F_ARTSTOCK
    const artstockColumnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'F_ARTSTOCK'
      ORDER BY COLUMN_NAME
    `);

    return NextResponse.json({
      success: true,
      data: {
        colonnesArticle: allColumnsResult.recordset,
        colonnesArtstock: artstockColumnsResult.recordset
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erreur'
    }, { status: 500 });
  }
}
