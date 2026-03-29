import { useEffect, useState } from 'react';

export const useAppVersion = () => {
  const [version, setVersion] = useState<string>('loading...');

  useEffect(() => {
    fetch('/VERSION.json')
      .then((res) => res.json())
      .then((data) => setVersion(data.version))
      .catch(() => setVersion('unknown'));
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
