'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MissionTemplate } from '@/types';

interface TemplatePickerProps {
  onSelect: (template: MissionTemplate) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('mission_templates')
      .select('*')
      .order('category')
      .then(({ data }) => {
        setTemplates(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-4">템플릿 불러오는 중...</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template)}
          className="bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl p-3 text-left transition-colors"
        >
          <p className="font-medium text-gray-800 text-sm">{template.title}</p>
          <p className="text-orange-600 text-xs font-semibold mt-1">{template.default_points}P</p>
          <p className="text-gray-400 text-xs mt-0.5">{template.category}</p>
        </button>
      ))}
    </div>
  );
}
