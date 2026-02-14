import { ActivePawnRowResponseDto } from './ActivePawnRowResponseDto';

export type ActivePawnTotalsResponseDto = {
  totalPawns: number;
  totalItems: number;
  totalPawnAmount: number;
  totalServiceChargesDue: number;
  totalPoliceHoldAmount: number;
};

export type ActivePawnsReportResponseDto = {
  rows: ActivePawnRowResponseDto[];
  totals: ActivePawnTotalsResponseDto;
};
