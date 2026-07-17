export interface AccountApi {
  balance?: number | null;
  id: number;
  isPrimary: boolean;
  name: string;
  openingBalance: number;
  type: string;
}

export interface AccountPayloadApi {
  isPrimary?: boolean;
  name: string;
  openingBalance: number;
  type: string;
}
