import { formatPoints, getMissionStatusLabel, getMissionStatusColor } from '@/lib/utils';

describe('formatPoints', () => {
  it('0P를 정상 출력한다', () => {
    expect(formatPoints(0)).toBe('0P');
  });

  it('1000P 이상은 천단위 구분자 포함', () => {
    const result = formatPoints(1000);
    expect(result).toBe('1,000P');
  });

  it('음수 포인트도 출력한다', () => {
    const result = formatPoints(-50);
    expect(result).toBe('-50P');
  });
});

describe('getMissionStatusLabel', () => {
  it('pending → 대기중', () => {
    expect(getMissionStatusLabel('pending')).toBe('대기중');
  });
  it('in_progress → 진행중', () => {
    expect(getMissionStatusLabel('in_progress')).toBe('진행중');
  });
  it('submitted → 인증대기', () => {
    expect(getMissionStatusLabel('submitted')).toBe('인증대기');
  });
  it('approved → 완료', () => {
    expect(getMissionStatusLabel('approved')).toBe('완료');
  });
  it('rejected → 반려', () => {
    expect(getMissionStatusLabel('rejected')).toBe('반려');
  });
  it('알 수 없는 상태는 원래 값 반환', () => {
    expect(getMissionStatusLabel('unknown')).toBe('unknown');
  });
});

describe('getMissionStatusColor', () => {
  it('각 상태에 올바른 CSS 클래스 반환', () => {
    expect(getMissionStatusColor('pending')).toContain('gray');
    expect(getMissionStatusColor('in_progress')).toContain('blue');
    expect(getMissionStatusColor('submitted')).toContain('yellow');
    expect(getMissionStatusColor('approved')).toContain('green');
    expect(getMissionStatusColor('rejected')).toContain('red');
  });
});
