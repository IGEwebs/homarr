import { Box, Card, Group, Stack, Text, useMantineTheme } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { linearGradientDef } from '@nivo/core';
import { Datum, ResponsiveLine, Serie } from '@nivo/line';
import { IconArrowsUpDown, IconDownload, IconUpload } from '@tabler/icons';
import { useTranslation } from 'next-i18next';
import { useEffect } from 'react';
import { useConfigContext } from '../../config/provider';
import { useGetTorrentData } from '../../hooks/widgets/torrents/useGetTorrentData';
import { humanFileSize } from '../../tools/humanFileSize';
import { AppType } from '../../types/app';
import { defineWidget } from '../helper';
import { IWidget } from '../widgets';

const definition = defineWidget({
  id: 'dlspeed',
  icon: IconArrowsUpDown,
  options: {},

  gridstack: {
    minWidth: 2,
    minHeight: 2,
    maxWidth: 12,
    maxHeight: 6,
  },
  component: TorrentNetworkTrafficTile,
});

export type ITorrentNetworkTraffic = IWidget<typeof definition['id'], typeof definition>;

interface TorrentNetworkTrafficTileProps {
  widget: ITorrentNetworkTraffic;
}

function TorrentNetworkTrafficTile({ widget }: TorrentNetworkTrafficTileProps) {
  const { t } = useTranslation(`modules/${definition.id}`);
  const { colors } = useMantineTheme();
  const { config } = useConfigContext();

  const [clientDataHistory, setClientDataHistory] = useListState<ClientDataHistory>([]);

  const { data, dataUpdatedAt } = useGetTorrentData({
    appId: widget.id,
    refreshInterval: 1000,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    data.torrents.forEach((item) => {
      const app = config?.apps.find((app) => app.id === item.appId);

      if (!app) {
        return;
      }

      const totalDownloadSpeed = item.torrents
        .map((torrent) => torrent.downloadSpeed)
        .reduce((accumulator, currentValue) => accumulator + currentValue);

      const totalUploadSpeed = item.torrents
        .map((torrent) => torrent.uploadSpeed)
        .reduce((accumulator, currentValue) => accumulator + currentValue);

      const entry: ClientDataEntry = {
        download: totalDownloadSpeed,
        upload: totalUploadSpeed,
        x: Date.now(),
      };

      if (!clientDataHistory.some((x) => x.app === app)) {
        setClientDataHistory.append({
          app,
          entries: [entry],
        });
        return;
      }

      setClientDataHistory.applyWhere(
        (x) => x.app === app,
        (client) => {
          client.entries.push(entry);
          return client;
        }
      );
    });
  }, [data, dataUpdatedAt]);

  useEffect(() => {
    clientDataHistory.forEach((client) => {
      if (client.entries.length < 30) {
        return;
      }

      setClientDataHistory.applyWhere(
        (item) => item === client,
        (previousClient) => {
          previousClient.entries.shift();
          return previousClient;
        }
      );
    });
  }, [clientDataHistory]);

  if (!data) {
    return null;
  }

  const lineChartData = [
    ...clientDataHistory.map(
      (clientData): Serie => ({
        id: `download_${clientData.app.id}`,
        data: clientData.entries.map(
          (entry): Datum => ({
            x: entry.x,
            y: entry.download,
          })
        ),
      })
    ),
    ...clientDataHistory.map(
      (clientData): Serie => ({
        id: `upload_${clientData.app.id}`,
        data: clientData.entries.map(
          (entry): Datum => ({
            x: entry.x,
            y: entry.upload,
          })
        ),
      })
    ),
  ];

  return (
    <Stack>
      <Box
        style={{
          height: 200,
          width: '100%',
        }}
      >
        <ResponsiveLine
          isInteractive
          enableSlices="x"
          sliceTooltip={({ slice }) => {
            const { points } = slice;

            const values: CapturedClientEntry[] = [];
            points.forEach((point) => {
              const pointId = String(point.serieId);
              const isDownload = pointId.startsWith('download_');
              const appId = pointId.split('_')[1];
              const app = clientDataHistory.find((x) => x.app.id === appId);

              if (!app) {
                return null;
              }

              const value = Number(point.data.y);

              const matchingApp = values.find((x) => x.app.id === app.app.id);
              if (matchingApp) {
                if (isDownload) {
                  matchingApp.download = value;
                } else {
                  matchingApp.upload = value;
                }
              } else {
                values.push({
                  app: app.app,
                  download: isDownload ? value : 0,
                  upload: !isDownload ? value : 0,
                });
              }
            });

            return (
              <Card p="xs" radius="md" withBorder>
                <Card.Section p="xs">
                  <Stack spacing="xs">
                    {values.map((value) => (
                      <Group>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={value.app.appearance.iconUrl}
                          width={20}
                          height={20}
                          alt="app icon"
                        />
                        <Stack spacing={0}>
                          <Text>{value.app.name}</Text>
                          <Group>
                            <Group spacing={3}>
                              <IconDownload opacity={0.7} size={16} />
                              <Text size="sm" color="dimmed">
                                {t('card.lineChart.download', {
                                  download: humanFileSize(value.download),
                                })}
                              </Text>
                            </Group>

                            <Group spacing={3}>
                              <IconUpload opacity={0.7} size={16} />
                              <Text size="sm" color="dimmed">
                                {t('card.lineChart.upload', {
                                  upload: humanFileSize(value.upload),
                                })}
                              </Text>
                            </Group>
                          </Group>
                        </Stack>
                      </Group>
                    ))}
                  </Stack>
                </Card.Section>
              </Card>
            );
          }}
          data={lineChartData}
          curve="monotoneX"
          yFormat=" >-.2f"
          axisLeft={{
            tickSize: 5,
            legend: 'Speed',
            tickPadding: 5,
            tickRotation: 0,
            legendOffset: 12,
            legendPosition: 'middle',
          }}
          axisBottom={null}
          axisRight={null}
          enablePoints={false}
          enableGridX={false}
          enableGridY={false}
          enableArea
          defs={[
            linearGradientDef('gradientA', [
              { offset: 0, color: 'inherit' },
              { offset: 100, color: 'inherit', opacity: 0 },
            ]),
          ]}
          fill={[{ match: '*', id: 'gradientA' }]}
          margin={{ left: 50, bottom: 5 }}
          animate={false}
        />
      </Box>
    </Stack>
  );
}

export default definition;

interface ClientDataHistory {
  app: AppType;
  entries: ClientDataEntry[];
}

interface ClientDataEntry {
  x: number;
  upload: number;
  download: number;
}

interface CapturedClientEntry {
  app: AppType;
  upload: number;
  download: number;
}
