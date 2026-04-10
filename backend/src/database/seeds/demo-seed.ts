import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { Customer, CustomerStatus } from '../../entities/customer.entity';
import { Artist, ArtistStatus } from '../../entities/artist.entity';
import { Transaction, TransactionStatus } from '../../entities/transaction.entity';

const DEMO_PASSWORD = 'admin123';

/**
 * 고객·작가·거래·감사/열람 이력, admin@example.com 을 제외한 사용자, 모든 팀을 삭제합니다.
 */
export async function clearBusinessData(dataSource: DataSource): Promise<void> {
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    await qr.query('DELETE FROM entity_histories');
    await qr.query('DELETE FROM access_requests');
    await qr.query('DELETE FROM audit_logs');
    await qr.query('DELETE FROM transactions');
    await qr.query('DELETE FROM customers');
    await qr.query('DELETE FROM artists');
    await qr.query(`DELETE FROM users WHERE email <> 'admin@example.com'`);
    await qr.query('DELETE FROM teams');
    await qr.commitTransaction();
    console.log('🗑️  Business data cleared (teams, users except admin@example.com)');
  } catch (e) {
    await qr.rollbackTransaction();
    throw e;
  } finally {
    await qr.release();
  }
}

export async function seedDemoBusinessData(dataSource: DataSource): Promise<void> {
  const teamRepo = dataSource.getRepository(Team);
  const userRepo = dataSource.getRepository(User);
  const customerRepo = dataSource.getRepository(Customer);
  const artistRepo = dataSource.getRepository(Artist);
  const txRepo = dataSource.getRepository(Transaction);

  const admin = await userRepo.findOne({ where: { email: 'admin@example.com' } });
  if (!admin) {
    throw new Error('admin@example.com 이 없습니다. 먼저 npm run seed 를 실행하세요.');
  }

  const teamSales = await teamRepo.save(
    teamRepo.create({
      name: '아트세일즈 1팀',
      description:
        '1차 시장 영업, 컬렉터·문화기관 계약, 해외 갤러리 파트너십 및 VIP 프리뷰 대응',
      isActive: true,
    }),
  );
  const teamCuratorial = await teamRepo.save(
    teamRepo.create({
      name: '큐레이션 운영팀',
      description:
        '전시 기획·작가 리레이션, 장당·프로젝트 운영, 대관·협력 전시 실행',
      isActive: true,
    }),
  );
  console.log(`✅ 데모 팀 2개: ${teamSales.name}, ${teamCuratorial.name}`);

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const managerSales = userRepo.create({
    email: 'park.minjun@prism-gallery.kr',
    password: hash,
    name: '박민준',
    role: UserRole.MANAGER,
    teamId: teamSales.id,
    isActive: true,
  });
  const staffSales = userRepo.create({
    email: 'jeong.haeun@prism-gallery.kr',
    password: hash,
    name: '정하은',
    role: UserRole.STAFF,
    teamId: teamSales.id,
    isActive: true,
  });
  const managerOps = userRepo.create({
    email: 'oh.jihun@prism-gallery.kr',
    password: hash,
    name: '오지훈',
    role: UserRole.MANAGER,
    teamId: teamCuratorial.id,
    isActive: true,
  });
  const staffOps = userRepo.create({
    email: 'kang.yujin@prism-gallery.kr',
    password: hash,
    name: '강유진',
    role: UserRole.STAFF,
    teamId: teamCuratorial.id,
    isActive: true,
  });

  await userRepo.save([managerSales, staffSales, managerOps, staffOps]);
  console.log('✅ 데모 사용자 4명 (비밀번호: admin123)');

  const now = new Date();
  const approve = (d: Date) => ({
    approvedById: admin.id,
    approvedAt: d,
  });

  /** 실존 인물·단체와 무관한 시드용 가상 작가만 사용합니다. */
  const artistRows: Array<Partial<Artist> & { name: string }> = [
    {
      name: '가상작가-강초롱',
      nationality: '대한민국(가상)',
      genre: '현대회화',
      bio: '[시드] 데모용 가상 프로필입니다. 실제 작가·경력과 무관합니다.',
      status: ArtistStatus.APPROVED,
      isActive: true,
      createdById: admin.id,
      ...approve(new Date(now.getTime() - 86400000 * 120)),
    },
    {
      name: 'Virtual Artist Sample-B',
      nationality: '가상 국적',
      genre: '사진·영상',
      bio: '[DEMO SEED] Fictional artist for UI testing only.',
      status: ArtistStatus.APPROVED,
      isActive: true,
      createdById: managerSales.id,
      ...approve(new Date(now.getTime() - 86400000 * 90)),
    },
    {
      name: '가상작가-최샘플',
      nationality: '대한민국(가상)',
      genre: '도자·조각',
      bio: '[시드] 테스트용 더미. 실명·실제 작가와 일치하지 않습니다.',
      status: ArtistStatus.APPROVED,
      isActive: true,
      createdById: staffSales.id,
      ...approve(new Date(now.getTime() - 86400000 * 60)),
    },
    {
      name: 'Virtual Artist Sample-D',
      nationality: '가상 국적',
      genre: '설치',
      bio: '[DEMO SEED] Placeholder artist. No real-world counterpart.',
      status: ArtistStatus.APPROVED,
      isActive: true,
      createdById: managerOps.id,
      ...approve(new Date(now.getTime() - 86400000 * 45)),
    },
    {
      name: '가상작가-한샘플',
      nationality: '대한민국(가상)',
      genre: '드로잉',
      bio: '[시드] 승인 대기 상태 검증용 가상 인물입니다.',
      status: ArtistStatus.PENDING,
      isActive: true,
      createdById: staffOps.id,
      approvedById: null,
      approvedAt: null,
    },
    {
      name: '가상작가-김샘플',
      nationality: '대한민국(가상)',
      genre: '디지털 미디어',
      bio: '[시드] 데모 거래·마스킹 테스트용 가상 프로필.',
      status: ArtistStatus.APPROVED,
      isActive: true,
      createdById: admin.id,
      ...approve(new Date(now.getTime() - 86400000 * 30)),
    },
  ];

  const artists = await artistRepo.save(
    artistRows.map((row) => artistRepo.create(row as Artist)),
  );
  console.log(`✅ 작가 ${artists.length}명`);
  const byName = (n: string) => artists.find((a) => a.name === n)!;

  const customerDefs: Array<{
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    teamId: string;
    createdById: string;
    status: CustomerStatus;
    approved?: boolean;
  }> = [
    {
      name: '[데모] 가상문화재단 알파',
      email: 'demo.foundation.alpha@example.com',
      phone: '02-0000-1001',
      address: '(시드) 가상시 데모구 샘플대로 1 — 실제 주소 아님',
      notes: '※ 시드용 가상 고객. 실제 기관·단체와 무관합니다.',
      teamId: teamSales.id,
      createdById: managerSales.id,
      status: CustomerStatus.APPROVED,
      approved: true,
    },
    {
      name: '[데모] 샘플 컬렉터 리나',
      email: 'demo.collector.lina@example.com',
      phone: '010-0000-2001',
      address: '(시드) 가상시 데모구 샘플대로 2',
      notes: '※ 가상 개인 고객. 실명·실존 인물과 무관합니다.',
      teamId: teamSales.id,
      createdById: staffSales.id,
      status: CustomerStatus.APPROVED,
      approved: true,
    },
    {
      name: '[데모] 가상아트트레이딩 주식회사',
      email: 'demo.art-trading@example.com',
      phone: '02-0000-1002',
      address: '(시드) 가상 특별시 데모빌딩 3층',
      notes: '※ 더미 법인. 사업자·도메인은 실제와 연결되지 않습니다.',
      teamId: teamSales.id,
      createdById: managerSales.id,
      status: CustomerStatus.APPROVED,
      approved: true,
    },
    {
      name: '[데모] 개인고객 샘플-윤',
      email: 'demo.individual.y@example.com',
      phone: '010-0000-2002',
      address: '(시드) 가상시 데모구 샘플대로 4',
      notes: '※ 승인 대기(PENDING) 시나리오용 가상 인물.',
      teamId: teamSales.id,
      createdById: staffSales.id,
      status: CustomerStatus.PENDING,
    },
    {
      name: '[데모] 가상건축 그룹 베타',
      email: 'demo.architecture.beta@example.com',
      phone: '02-0000-1003',
      address: '(시드) 가상시 데모구 샘플대로 5',
      notes: '※ 설치·프로젝트 시나리오용 가상 고객.',
      teamId: teamCuratorial.id,
      createdById: managerOps.id,
      status: CustomerStatus.APPROVED,
      approved: true,
    },
    {
      name: '[데모] 개인고객 샘플-박',
      email: 'demo.individual.p@example.com',
      phone: '010-0000-2003',
      address: '(시드) 가상시 데모구 샘플대로 6',
      notes: '※ 가상 개인. 실존 개인과 무관합니다.',
      teamId: teamCuratorial.id,
      createdById: staffOps.id,
      status: CustomerStatus.APPROVED,
      approved: true,
    },
    {
      name: '[데모] 가상시립미술관 큐레이션팀',
      email: 'demo.curatorial.museum@example.com',
      phone: '02-0000-1004',
      address: '(시드) 가상시립미술관 — 실제 공공기관 아님',
      notes: '※ 국립·시립 등 실제 기관명을 모방하지 않은 완전 가상명입니다.',
      teamId: teamCuratorial.id,
      createdById: managerOps.id,
      status: CustomerStatus.APPROVED,
      approved: true,
    },
    {
      name: '[데모] 가상테크 주식회사',
      email: 'demo.tech.corp@example.com',
      phone: '02-0000-1005',
      address: '(시드) 가상시 데모구 샘플대로 7',
      notes: '※ DRAFT 상태 검증용 가상 법인.',
      teamId: teamSales.id,
      createdById: managerSales.id,
      status: CustomerStatus.DRAFT,
    },
  ];

  const customers: Customer[] = [];
  for (const def of customerDefs) {
    const c = customerRepo.create({
      name: def.name,
      email: def.email,
      phone: def.phone,
      address: def.address,
      notes: def.notes,
      teamId: def.teamId,
      createdById: def.createdById,
      status: def.status,
      approvedById: def.approved ? admin.id : null,
      approvedAt: def.approved ? new Date(now.getTime() - 86400000 * 14) : null,
      rejectionReason: null,
      isDeleted: false,
      deletedAt: null,
    });
    customers.push(await customerRepo.save(c));
  }
  console.log(`✅ 고객 ${customers.length}건`);

  const cust = (name: string) => customers.find((x) => x.name === name)!;

  const txDefs: Array<{
    customerName: string;
    artistName: string;
    amount: string;
    date: string;
    terms: string;
    teamId: string;
    createdById: string;
    status: TransactionStatus;
    approved: boolean;
  }> = [
    {
      customerName: '[데모] 가상문화재단 알파',
      artistName: '가상작가-강초롱',
      amount: '185000000',
      date: '2025-11-18',
      terms: '[시드] 가상 계약 조항 텍스트 — 법적 효력 없음.',
      teamId: teamSales.id,
      createdById: managerSales.id,
      status: TransactionStatus.APPROVED,
      approved: true,
    },
    {
      customerName: '[데모] 샘플 컬렉터 리나',
      artistName: 'Virtual Artist Sample-B',
      amount: '42000000',
      date: '2025-12-03',
      terms: '[시드] 에디션·납품 조건 더미.',
      teamId: teamSales.id,
      createdById: staffSales.id,
      status: TransactionStatus.APPROVED,
      approved: true,
    },
    {
      customerName: '[데모] 가상아트트레이딩 주식회사',
      artistName: '가상작가-최샘플',
      amount: '68000000',
      date: '2026-01-15',
      terms: '[시드] 해외 인도 조건 더미.',
      teamId: teamSales.id,
      createdById: managerSales.id,
      status: TransactionStatus.APPROVED,
      approved: true,
    },
    {
      customerName: '[데모] 가상건축 그룹 베타',
      artistName: 'Virtual Artist Sample-D',
      amount: '95000000',
      date: '2026-02-20',
      terms: '[시드] 설치·감리 더미 조항.',
      teamId: teamCuratorial.id,
      createdById: managerOps.id,
      status: TransactionStatus.APPROVED,
      approved: true,
    },
    {
      customerName: '[데모] 개인고객 샘플-박',
      artistName: '가상작가-김샘플',
      amount: '12800000',
      date: '2026-03-05',
      terms: '[시드] 디지털+프린트 패키지 더미.',
      teamId: teamCuratorial.id,
      createdById: staffOps.id,
      status: TransactionStatus.APPROVED,
      approved: true,
    },
    {
      customerName: '[데모] 가상시립미술관 큐레이션팀',
      artistName: '가상작가-강초롱',
      amount: '0',
      date: '2026-03-28',
      terms: '[시드] 대여 전시 시나리오용 금액 0원 더미.',
      teamId: teamCuratorial.id,
      createdById: managerOps.id,
      status: TransactionStatus.PENDING,
      approved: false,
    },
    {
      customerName: '[데모] 가상문화재단 알파',
      artistName: 'Virtual Artist Sample-D',
      amount: '220000000',
      date: '2026-04-02',
      terms: '[시드] DRAFT 거래 더미 조항.',
      teamId: teamSales.id,
      createdById: managerSales.id,
      status: TransactionStatus.DRAFT,
      approved: false,
    },
  ];

  for (const t of txDefs) {
    const row = txRepo.create({
      customerId: cust(t.customerName).id,
      artistId: byName(t.artistName).id,
      amount: Number(t.amount),
      currency: 'KRW',
      contractTerms: t.terms,
      transactionDate: new Date(t.date),
      status: t.status,
      createdById: t.createdById,
      teamId: t.teamId,
      approvedById: t.approved ? admin.id : null,
      approvedAt: t.approved ? new Date(now.getTime() - 86400000 * 3) : null,
      rejectionReason: null,
    });
    await txRepo.save(row);
  }
  console.log(`✅ 거래 ${txDefs.length}건`);
  console.log('');
  console.log('📋 데모 계정 (비밀번호 모두 admin123)');
  console.log(`   park.minjun@prism-gallery.kr  (${teamSales.name} · 매니저)`);
  console.log(`   jeong.haeun@prism-gallery.kr (${teamSales.name} · 스태프)`);
  console.log(`   oh.jihun@prism-gallery.kr    (${teamCuratorial.name} · 매니저)`);
  console.log(`   kang.yujin@prism-gallery.kr  (${teamCuratorial.name} · 스태프)`);
}
