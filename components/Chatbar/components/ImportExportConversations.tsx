import { ChangeEvent, FC, useContext, useRef } from 'react';

import { useTranslation } from 'next-i18next';

import { useImportHistory } from '@/hooks/useImportHistory';
import ChatbarContext from '../Chatbar.context';

const actionButtonClass =
  'flex flex-1 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md border border-neutral-200 px-3 py-3 text-[14px] leading-3 text-black transition-colors duration-200 hover:bg-gray-500/10';

export const ImportExportConversations: FC = () => {
  const { t } = useTranslation('sidebar');
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleExportData } = useContext(ChatbarContext);
  const importConversationsFromFile = useImportHistory();

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      importConversationsFromFile(file);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        tabIndex={-1}
        type="file"
        accept=".json"
        title={t('Import')}
        onChange={handleFileChange}
      />
      <div className="flex w-full gap-2">
        <button
          type="button"
          className={actionButtonClass}
          onClick={openFilePicker}
          title={t('Import')}
          aria-label={t('Import')}
        >
          <span>{t('Import')}</span>
        </button>
        <button
          type="button"
          className={actionButtonClass}
          onClick={handleExportData}
          title={t('Export')}
          aria-label={t('Export')}
        >
          <span>{t('Export')}</span>
        </button>
      </div>
    </>
  );
};
