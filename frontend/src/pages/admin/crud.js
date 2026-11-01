import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";

export function useCrud(entity) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/${entity}`);
      setItems(data);
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setLoading(false);
  }, [entity]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (payload, id) => {
    try {
      if (id) {
        await api.put(`/admin/${entity}/${id}`, payload);
        toast.success("تم حفظ التعديلات بنجاح");
      } else {
        await api.post(`/admin/${entity}`, payload);
        toast.success("تمت الإضافة بنجاح");
      }
      await refresh();
      return true;
    } catch (e) {
      toast.error(formatApiError(e));
      return false;
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/${entity}/${id}`);
      toast.success("تم الحذف بنجاح");
      await refresh();
      return true;
    } catch (e) {
      toast.error(formatApiError(e));
      return false;
    }
  };

  const setOrder = async (item, direction) => {
    const idx = items.findIndex((x) => x.id === item.id);
    const other = direction === "up" ? items[idx - 1] : items[idx + 1];
    if (!other) return;
    try {
      await api.put(`/admin/${entity}/${item.id}`, { ...item, order: other.order });
      await api.put(`/admin/${entity}/${other.id}`, { ...other, order: item.order });
      await refresh();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const togglePublish = async (item) => {
    await save({ ...item, published: !item.published }, item.id);
  };

  return { items, loading, refresh, save, remove, setOrder, togglePublish };
}
