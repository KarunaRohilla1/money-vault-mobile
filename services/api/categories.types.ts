export interface CategoryApi {
  categoryType: string;
  emoji: string;
  id: number;
  isSystem: boolean;
  name: string;
  parentCategory?: string | null;
  transactionCount?: number | null;
}

export interface CategoryPayloadApi {
  categoryType: string;
  emoji: string;
  name: string;
}
