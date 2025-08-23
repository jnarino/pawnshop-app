import { useEffect, useMemo, useState } from 'react';

export interface InvCategory {
  id?: string;
  name: string;
  code: string;
  parentCode?: string | null;
  children?: InvCategory[];
}

interface CategoriesState {
  roots: InvCategory[];
  byCode: Record<string, InvCategory>;
}

export function useInventoryCategories() {
  const [state, setState] = useState<CategoriesState>({ roots: [], byCode: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/inventory/categories/tree`, { credentials: 'include' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data: InvCategory[] = await res.json();
        if (!mounted) return;

        const byCode: Record<string, InvCategory> = {};
        const walk = (n: InvCategory, parent?: string | null) => {
          byCode[n.code] = { ...n, parentCode: parent ?? null };
          n.children?.forEach(c => walk(c, n.code));
        };
        data.forEach(n => walk(n, null));
        setState({ roots: data, byCode });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'failed_to_load_categories');
        setState({ roots: [], byCode: {} });
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const lists = useMemo(() => {
    const typeOptions = state.roots;
    const subcat1OptionsFor = (typeCode?: string) =>
      (typeCode ? state.byCode[typeCode]?.children ?? [] : []);
    const brandOptionsFor = (subcat1Code?: string) =>
      (subcat1Code ? state.byCode[subcat1Code]?.children ?? [] : []);
    return { typeOptions, subcat1OptionsFor, brandOptionsFor };
  }, [state]);

  return { loading, error, ...lists };
}