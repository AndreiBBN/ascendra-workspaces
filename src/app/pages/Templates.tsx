import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { CardSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { getTemplates, saveTemplate } from '../api/workspacesApi';
import { useAsyncData } from '../hooks/useAsyncData';
import type { VMTemplate } from '../api/workspacesApi';
import {
  X,
  Plus,
  Pencil,
  ExternalLink,
  Cpu,
  MemoryStick,
  HardDrive,
  Package,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';

type Template = VMTemplate;

const TOOL_COLORS: Record<string, string> = {
  'vscode-server': 'bg-blue-50 text-blue-700 border-blue-200',
  'docker': 'bg-sky-50 text-sky-700 border-sky-200',
  'node': 'bg-green-50 text-green-700 border-green-200',
  'pnpm': 'bg-green-50 text-green-700 border-green-200',
  'python': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'jupyter': 'bg-orange-50 text-orange-700 border-orange-200',
  'cuda-toolkit': 'bg-purple-50 text-purple-700 border-purple-200',
  'postgres-client': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'redis-cli': 'bg-red-50 text-red-700 border-red-200',
  'git': 'bg-gray-100 text-gray-700 border-gray-200',
};

function TemplateCard({ template, onEdit }: { template: Template; onEdit: (t: Template) => void }) {
  return (
    <Card className="group flex flex-col hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-700">
      <CardContent className="pt-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm leading-snug">{template.name}</h3>
              {template.active
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              }
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{template.description}</p>
          </div>
        </div>

        {/* Base image */}
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 w-fit">
          {template.baseImage}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-lg py-2">
            <Cpu className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mb-1" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{template.vcpu}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">vCPU</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-lg py-2">
            <MemoryStick className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mb-1" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{template.memoryGB}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">GB RAM</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-lg py-2">
            <HardDrive className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mb-1" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{template.diskGB}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">GB disk</span>
          </div>
        </div>

        {/* Tools */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Package className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">Preinstalled</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {template.tools.map(tool => (
              <Badge
                key={tool}
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-5 ${TOOL_COLORS[tool] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
              >
                {tool}
              </Badge>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 mt-auto border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>{template.usedByVMs} VMs</span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 dark:text-gray-400 gap-1">
              <ExternalLink className="w-3 h-3" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-indigo-600 gap-1 hover:bg-indigo-50"
              onClick={() => onEdit(template)}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FormState {
  name: string;
  description: string;
  baseImage: string;
  vcpu: string;
  memoryGB: string;
  diskGB: string;
  tools: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  baseImage: 'Ubuntu 22.04',
  vcpu: '4',
  memoryGB: '8',
  diskGB: '100',
  tools: '',
  active: true,
};

function templateToForm(t: Template): FormState {
  return {
    name: t.name,
    description: t.description,
    baseImage: t.baseImage,
    vcpu: String(t.vcpu),
    memoryGB: String(t.memoryGB),
    diskGB: String(t.diskGB),
    tools: t.tools.join(', '),
    active: t.active,
  };
}

function TemplateDrawer({
  editTarget,
  onClose,
  onSave,
}: {
  editTarget: Template | null;
  onClose: () => void;
  onSave: (template: Template) => Promise<void>;
}) {
  const isEdit = editTarget !== null;
  const [form, setForm] = useState<FormState>(
    isEdit ? templateToForm(editTarget!) : emptyForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Template name is required';
    if (!form.vcpu || isNaN(Number(form.vcpu))) errs.vcpu = 'Must be a number';
    if (!form.memoryGB || isNaN(Number(form.memoryGB))) errs.memoryGB = 'Must be a number';
    if (!form.diskGB || isNaN(Number(form.diskGB))) errs.diskGB = 'Must be a number';
    return errs;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setSubmitError(null);
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const nextTemplate: Template = {
        id: editTarget?.id ?? `template-${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim(),
        baseImage: form.baseImage.trim() || 'Ubuntu 22.04',
        vcpu: Number(form.vcpu),
        memoryGB: Number(form.memoryGB),
        diskGB: Number(form.diskGB),
        tools: form.tools.split(',').map(tool => tool.trim()).filter(Boolean),
        usedByVMs: editTarget?.usedByVMs ?? 0,
        active: form.active,
      };

      await onSave(nextTemplate);
      setSaved(true);
      window.setTimeout(onClose, 800);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[440px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">{isEdit ? 'Edit template' : 'Create template'}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 p-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="tpl-name">Template name <span className="text-red-500">*</span></Label>
            <Input
              id="tpl-name"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Frontend Workspace"
              className={`dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="tpl-desc">Description</Label>
            <Input
              id="tpl-desc"
              value={form.description}
              onChange={set('description')}
              placeholder="Short description of the workspace purpose"
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">Shown to developers when selecting a template.</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tpl-image">Base image</Label>
            <Input
              id="tpl-image"
              value={form.baseImage}
              onChange={set('baseImage')}
              placeholder="Ubuntu 22.04"
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tpl-cpu">vCPU <span className="text-red-500">*</span></Label>
              <Input
                id="tpl-cpu"
                type="number"
                min={1}
                value={form.vcpu}
                onChange={set('vcpu')}
                className={`dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 ${errors.vcpu ? 'border-red-400' : ''}`}
              />
              {errors.vcpu && <p className="text-xs text-red-500">{errors.vcpu}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-ram">RAM (GB) <span className="text-red-500">*</span></Label>
              <Input
                id="tpl-ram"
                type="number"
                min={1}
                value={form.memoryGB}
                onChange={set('memoryGB')}
                className={`dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 ${errors.memoryGB ? 'border-red-400' : ''}`}
              />
              {errors.memoryGB && <p className="text-xs text-red-500">{errors.memoryGB}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-disk">Disk (GB) <span className="text-red-500">*</span></Label>
              <Input
                id="tpl-disk"
                type="number"
                min={1}
                value={form.diskGB}
                onChange={set('diskGB')}
                className={`dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 ${errors.diskGB ? 'border-red-400' : ''}`}
              />
              {errors.diskGB && <p className="text-xs text-red-500">{errors.diskGB}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tpl-tools">Preinstalled tools</Label>
            <Input
              id="tpl-tools"
              value={form.tools}
              onChange={set('tools')}
              placeholder="vscode-server, docker, node"
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">Comma-separated list of tools to preinstall.</p>
          </div>

          {submitError && <p className="text-xs text-red-500">{submitError}</p>}

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Active</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Inactive templates are hidden from developers.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                form.active ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  form.active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>

        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            className={`flex-1 gap-2 ${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
            onClick={handleSave}
            disabled={saving}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </>
            ) : saving ? (
              'Saving…'
            ) : (
              isEdit ? 'Save template' : 'Create template'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Templates() {
  const { data, loading, error, refetch } = useAsyncData(
    (forceRefresh) => getTemplates(forceRefresh),
    [],
  );
  const [optimisticTemplates, setOptimisticTemplates] = useState<Template[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const templates = useMemo(() => optimisticTemplates.length > 0 ? optimisticTemplates : (data ?? []), [data, optimisticTemplates]);

  const openCreate = () => { setEditTarget(null); setDrawerOpen(true); };
  const openEdit = (t: Template) => { setEditTarget(t); setDrawerOpen(true); };
  const closeDrawer = () => setDrawerOpen(false);

  const handleSaveTemplate = async (template: Template) => {
    const saved = await saveTemplate(template);
    setOptimisticTemplates(prev => {
      const base = prev.length > 0 ? prev : (data ?? []);
      const existingIndex = base.findIndex(candidate => candidate.id === saved.id);
      if (existingIndex >= 0) {
        const next = [...base];
        next[existingIndex] = saved;
        return next;
      }
      return [saved, ...base];
    });
  };

  const activeTemplates = templates.filter(template => template.active).length;
  const mostUsedTemplate = templates.reduce<Template | null>((current, template) => {
    if (!current || template.usedByVMs > current.usedByVMs) {
      return template;
    }
    return current;
  }, null);

  return (
    <AppShell
      title="Templates"
      subtitle="Create and manage reusable VM configurations for developer workspaces."
      showTimeRange={false}
    >
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total templates" value={templates.length} />
          <MetricCard title="Active templates" value={activeTemplates} />
          <MetricCard title="Most used" value={mostUsedTemplate?.name ?? '—'} subtext={`${mostUsedTemplate?.usedByVMs ?? 0} VMs`} />
          <MetricCard title="Avg monthly cost" value={`$${Math.round((templates.reduce((sum, template) => sum + template.memoryGB * 12, 0) / Math.max(templates.length, 1)) / 10)}`} subtext="per developer est." />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">All templates</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{templates.length} templates configured</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Create template
          </Button>
        </div>

        {/* Template grid — showing ready state with data */}
        {loading && templates.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState
            title="Could not load templates"
            description="There was a problem fetching template data. Please try again."
            onRetry={() => refetch(true)}
          />
        ) : templates.length === 0 ? (
          <EmptyState
            title="No templates yet"
            description="Create your first VM template to let developers spin up workspaces."
            action={{ label: 'Create template', onClick: openCreate }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map(template => (
              <TemplateCard key={template.id} template={template} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      {drawerOpen && (
        <TemplateDrawer editTarget={editTarget} onClose={closeDrawer} onSave={handleSaveTemplate} />
      )}
    </AppShell>
  );
}
