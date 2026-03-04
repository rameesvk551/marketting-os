// ── Category Types ──

export interface CreateCategoryDTO {
    name: string;
    parentCategory?: string | null;
    status?: 'active' | 'inactive';
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> { }

export interface CategoryQuery {
    page?: number;
    limit?: number;
    status?: string;
    parent?: string;
}
