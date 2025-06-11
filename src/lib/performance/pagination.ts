// src/lib/performance/pagination.ts
  /**
   * Utilidades para paginación eficiente
   */
  
  export interface PaginationConfig {
    page: number;
    limit: number;
    total: number;
  }
  
  export function calculatePagination(config: PaginationConfig) {
    const { page, limit, total } = config;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);
  
    return {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      startIndex,
      endIndex,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startItem: startIndex + 1,
      endItem: endIndex
    };
  }
  
  