'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WorklogWidgetData } from './data';
import { Big, Column, Frame, Metric, MetricRow, Sub, WIDGET_URI, emptyBody, type WidgetViewProps } from './components';
import { wonShort } from './format';

export function WorklogWidget(props: WidgetViewProps<WorklogWidgetData>) {
  const { p, data, at, stale } = props;
  const empty = emptyBody(p, props);
  return (
    <Frame p={p} title={`근무일지 · ${data?.month ?? new Date().getMonth() + 1}월 실수령`} link={WIDGET_URI.worklog} at={at} stale={stale}>
      {empty ??
        (data && (
          <Column>
            <Big p={p} text={wonShort(data.totalNet)} />
            <Sub p={p} text={data.today ? `오늘 · ${data.today.title}` : '오늘 기록 없음'} color={data.today ? p.text : p.muted} />
            <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
              <FlexWidget style={{ flex: 1 }}>
                <MetricRow p={p}>
                  <Metric p={p} label="근무" value={`${data.workDays}일`} />
                  <Metric p={p} label="받은 돈" value={wonShort(data.receivedNet)} />
                  <Metric p={p} label="미수령" value={wonShort(data.pendingNet)} />
                </MetricRow>
              </FlexWidget>
              <FlexWidget
                clickAction="OPEN_URI"
                clickActionData={{ uri: WIDGET_URI.worklogAdd }}
                style={{
                  backgroundColor: p.brand,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  marginTop: 8,
                  marginLeft: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TextWidget text="+ 입력" style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }} />
              </FlexWidget>
            </FlexWidget>
          </Column>
        ))}
    </Frame>
  );
}
