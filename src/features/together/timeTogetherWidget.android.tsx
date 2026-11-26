import { Column, Text } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

type WidgetProps = { summary: string; caption: string };

function TimeTogetherLayout({ summary, caption }: WidgetProps) {
  'widget';
  return (
    <Column modifiers={[fillMaxSize(), background('#641352'), paddingAll(14)]} verticalArrangement={{ spacedBy: 5 }}>
      <Text color="#FFD6E9" style={{ fontSize: 12, fontWeight: 'bold' }}>TOGETHERLY</Text>
      <Text color="#FFFFFF" style={{ fontSize: 18, fontWeight: 'bold' }}>{summary}</Text>
      <Text color="#FFD6E9" style={{ fontSize: 12 }}>{caption}</Text>
    </Column>
  );
}

const empty = { summary: 'Time Together', caption: 'Add a shared date in Togetherly.' };
const widget = createWidget('TogetherlyTimeTogether', TimeTogetherLayout, empty);

export function writeTimeTogetherWidget(summary: string, caption: string) {
  widget.updateSnapshot({ summary, caption });
}

export function clearTimeTogetherWidget() {
  widget.updateSnapshot(empty);
}

export default widget;
