'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import * as XLSX from 'xlsx';

import { MessageState } from '@/features/dashboard/MessageState';
import { TitleBar } from '@/features/dashboard/TitleBar';

type Prospect = {
  name: string | null;
  title: string | null;
  location: string | null;
  profileUrl: string | null;
  avatar: string | null;
};

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    if (!linkedinUrl || !linkedinUrl.startsWith('https://www.linkedin.com/search/results/people')) {
      setError('Please enter a valid LinkedIn search URL.(https://www.linkedin.com/search/results/people + ***)');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await fetch(`/api/linkedin?url=${encodeURIComponent(linkedinUrl)}`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setProspects(data.prospects);
    } catch (err: any) {
      setError(err.message || 'Scraping failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <MessageState
        icon={(
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0 0h24v24H0z" stroke="none" />
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3M12 12l8-4.5M12 12v9M12 12L4 7.5" />
          </svg>
        )}
        title={t('message_state_title')}
        description={t.rich('message_state_description', {
          code: chunks => (
            <code className="bg-secondary text-secondary-foreground">
              {chunks}
            </code>
          ),
        })}
        button={(
          <div className="mt-4 space-y-2">
            <input
              type="text"
              placeholder="Paste LinkedIn search URL..."
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
              className="w-full rounded border px-4 py-2"
            />
            <button
              onClick={handleScrape}
              type="button"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Scraping...' : 'Preview List'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      />

      {prospects.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                const data = prospects.map(p => ({
                  姓名: p.name || '',
                  职位: p.title || '',
                  地点: p.location || '',
                  LinkedIn资料: p.profileUrl || '',
                }));

                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Prospects');

                // 生成文件并下载
                XLSX.writeFile(wb, 'linkedin_prospects.xlsx');
              }}
              className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出 Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">头像</th>
                  <th className="p-2 text-left">姓名</th>
                  <th className="p-2 text-left">职位</th>
                  <th className="p-2 text-left">地点</th>
                  <th className="p-2 text-left">LinkedIn</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      {p.avatar
                        ? (
                            <img
                              src={p.avatar}
                              alt={(p.name || '头像') as string}
                              className="size-10 rounded-full object-cover"
                            />
                          )
                        : (
                            <div className="flex size-10 items-center justify-center rounded-full bg-gray-200">
                              <span className="text-lg text-gray-500">
                                {p.name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                    </td>
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-gray-600">{p.title}</td>
                    <td className="p-2 text-gray-600">{p.location}</td>
                    <td className="p-2">
                      <a
                        href={p.profileUrl || ''}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        查看资料
                        <svg className="ml-1 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardIndexPage;
