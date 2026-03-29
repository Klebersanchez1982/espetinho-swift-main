import { useEffect, useState } from 'react';

export const useAppVersion = () => {
  const [version, setVersion] = useState<string>('loading...');

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const versionUrl = new URL('VERSION.json', window.location.origin + baseUrl).toString();
    
    fetch(versionUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setVersion(data.version ?? 'unknown'))
      .catch((error) => {
        console.error('Erro ao carregar versão:', error);
        setVersion('unknown');
      });
  }, []);

  return version;
};

export const VersionBadge = () => {
  const version = useAppVersion();

  return (
    <div className="fixed bottom-4 right-4 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
      v{version}
    </div>
  );
};
