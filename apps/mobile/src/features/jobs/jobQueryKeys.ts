const all = ['jobs'] as const;

export const jobQueryKeys = {
  all,
  lists: () => [...all, 'list'] as const,
  list: (pageSize: number) => [...all, 'list', { pageSize }] as const,
  detail: (id: string) => [...all, 'detail', id] as const,
};
