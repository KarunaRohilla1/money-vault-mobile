export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type EmptyRecord = Record<string, never>;

export interface Database {
  public: {
    Tables: EmptyRecord;
    Views: EmptyRecord;
    Functions: EmptyRecord;
    Enums: EmptyRecord;
    CompositeTypes: EmptyRecord;
  };
}
