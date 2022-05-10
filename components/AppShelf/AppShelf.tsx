import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Text,
  AspectRatio,
  SimpleGrid,
  Card,
  useMantineTheme,
  Image,
  Group,
  Space,
} from '@mantine/core';
import { useConfig } from '../../tools/state';
import { pingQbittorrent } from '../../tools/api';
import { serviceItem } from '../../tools/types';
import AddItemShelfItem from './AddAppShelfItem';
import { AppShelfItemWrapper } from './AppShelfItemWrapper';
import AppShelfMenu from './AppShelfMenu';

const AppShelf = (props: any) => {
  const { config, addService, removeService, setConfig } = useConfig();

  /* A hook that is used to load the config from local storage. */
  useEffect(() => {
    const localConfig = localStorage.getItem('config');
    if (localConfig) {
      setConfig(JSON.parse(localConfig));
    }
  }, []);
  if (config.services && config.services.length === 0) {
    config.services.forEach((service) => {
      if (service.type === 'qBittorrent') {
        pingQbittorrent(service);
      }
    });
  }

  return (
    <SimpleGrid m="xl" cols={5} spacing="xl">
      {config.services.map((service, i) => (
        <AppShelfItem key={service.name} service={service} />
      ))}
      <AddItemShelfItem />
    </SimpleGrid>
  );
};

export function AppShelfItem(props: any) {
  const { service }: { service: serviceItem } = props;
  const theme = useMantineTheme();
  const { removeService } = useConfig();
  const [hovering, setHovering] = useState(false);
  return (
    <motion.div
      key={service.name}
      onHoverStart={(e) => {
        setHovering(true);
      }}
      onHoverEnd={(e) => {
        setHovering(false);
      }}
    >
      <AppShelfItemWrapper hovering={hovering}>
        <Card.Section>
          <Group position="apart" mx="lg">
            <Space />
            <Text
              // TODO: #1 Remove this hack to get the text to be centered.
              ml={15}
              style={{
                alignSelf: 'center',
                alignContent: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                justifyItems: 'center',
              }}
              mt="sm"
              weight={500}
            >
              {service.name}
            </Text>
            <motion.div
              style={{
                alignSelf: 'flex-end',
              }}
              animate={{
                opacity: hovering ? 1 : 0,
              }}
            >
              <AppShelfMenu service={service} removeitem={removeService} />
            </motion.div>
          </Group>
        </Card.Section>
        <Card.Section>
          <AspectRatio ratio={5 / 3} m="xl">
            <motion.i
              whileHover={{
                cursor: 'pointer',
                scale: 1.1,
              }}
            >
              <Image
                onClick={() => {
                  window.open(service.url);
                }}
                style={{
                  maxWidth: '50%',
                  marginBottom: 10,
                }}
                src={service.icon}
              />
            </motion.i>
          </AspectRatio>
        </Card.Section>
      </AppShelfItemWrapper>
    </motion.div>
  );
}

export default AppShelf;
