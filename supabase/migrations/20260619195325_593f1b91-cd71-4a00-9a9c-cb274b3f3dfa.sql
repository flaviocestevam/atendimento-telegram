ALTER TABLE public.memories DROP CONSTRAINT memories_lead_id_fkey;
ALTER TABLE public.memories ADD CONSTRAINT memories_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

ALTER TABLE public.objections DROP CONSTRAINT objections_lead_id_fkey;
ALTER TABLE public.objections ADD CONSTRAINT objections_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;