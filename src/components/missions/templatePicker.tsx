'use client';

import { useEffect, useState } from 'react';
import { getMissionTemplates } from '@/lib/firebase/db';
import type { MissionTemplate } from '@/types';

interface TemplatePickerProps {
  onSelect: (template: MissionTemplate) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMissionTemplates()
      .then((data) => {
        setTemplates(data);
      })
      .catch((err) => {
        console.error('[TemplatePicker] 템플릿 로드 실패:', err);
      })
      .finally(() => {
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
          <p className="text-orange-600 text-xs font-semibold mt-1">{template.defaultPoints}P</p>
          <p className="text-gray-400 text-xs mt-0.5">{template.category}</p>
        </button>
      ))}
    </div>
  );
}
