import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { Permission } from '../../entities/permission.entity';
import { RolePermission } from '../../entities/role-permission.entity';

export async function seedInitialData(dataSource: DataSource): Promise<void> {
  const teamRepository = dataSource.getRepository(Team);
  const userRepository = dataSource.getRepository(User);
  const permissionRepository = dataSource.getRepository(Permission);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);

  console.log('🌱 Starting database seeding...');

  // 1. 기본 팀 생성
  let managementTeam = await teamRepository.findOne({
    where: { name: 'Management' },
  });

  if (!managementTeam) {
    managementTeam = teamRepository.create({
      name: 'Management',
      description: 'Management Team',
      isActive: true,
    });
    managementTeam = await teamRepository.save(managementTeam);
    console.log('✅ Created Management team');
  } else {
    console.log('ℹ️  Management team already exists');
  }

  // 2. 관리자 계정 생성/업데이트
  const adminEmail = 'admin@example.com';
  let adminUser = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    // 기본 비밀번호: admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    adminUser = userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'Master Admin',
      role: UserRole.MASTER,
      teamId: undefined, // 관리자는 팀 없음
      isActive: true,
    });
    adminUser = await userRepository.save(adminUser);
    console.log('✅ Created admin user');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: admin123`);
    console.log('   ⚠️  Please change the password after first login!');
  } else {
    // 기존 계정이 있으면 MASTER로 업데이트하고 팀을 null로 설정
    let updated = false;
    if (adminUser.role !== UserRole.MASTER) {
      adminUser.role = UserRole.MASTER;
      updated = true;
      console.log('✅ Updated admin user to MASTER role');
    }
    if (adminUser.teamId !== null && adminUser.teamId !== undefined) {
      (adminUser as any).teamId = null;
      updated = true;
      console.log('✅ Updated admin user team to null (no team)');
    }
    if (updated) {
      adminUser = await userRepository.save(adminUser);
    } else {
      console.log('ℹ️  Admin user already exists with MASTER role and no team');
    }
  }

  // 3. 추가 팀 생성 (선택사항)
  const salesTeam = await teamRepository.findOne({
    where: { name: 'Sales' },
  });

  if (!salesTeam) {
    const newSalesTeam = teamRepository.create({
      name: 'Sales',
      description: 'Sales Team',
      isActive: true,
    });
    await teamRepository.save(newSalesTeam);
    console.log('✅ Created Sales team');
  }

  const operationsTeam = await teamRepository.findOne({
    where: { name: 'Operations' },
  });

  if (!operationsTeam) {
    const newOpsTeam = teamRepository.create({
      name: 'Operations',
      description: 'Operations Team',
      isActive: true,
    });
    await teamRepository.save(newOpsTeam);
    console.log('✅ Created Operations team');
  }

  // 4. 기본 Permission 및 RolePermission 생성
  const basePermissions: Array<Partial<Permission>> = [
    {
      key: 'MANAGE_PERMISSIONS',
      name: '권한 설정 관리',
      description: '역할(Role)에 대한 권한(Permission) 설정을 관리할 수 있습니다.',
    },
    {
      key: 'MANAGE_USERS',
      name: '사용자 관리',
      description: '사용자 계정 생성, 수정, 비활성화 등을 수행할 수 있습니다.',
    },
    {
      key: 'APPROVE_CUSTOMER',
      name: '고객 승인',
      description: '고객 정보 승인/반려를 수행할 수 있습니다.',
    },
    {
      key: 'APPROVE_ACCESS_REQUEST',
      name: '열람 요청 승인',
      description: '마스킹된 데이터 열람 요청을 승인/거부할 수 있습니다.',
    },
  ];

  for (const p of basePermissions) {
    let perm = await permissionRepository.findOne({ where: { key: p.key } });
    if (!perm) {
      perm = permissionRepository.create(p);
      await permissionRepository.save(perm);
      console.log(`✅ Created permission: ${p.key}`);
    }
  }

  const allPermissions = await permissionRepository.find();

  const ensureRolePermissions = async (role: UserRole, permissionKeys: string[]) => {
    const targetPerms = allPermissions.filter((p) => permissionKeys.includes(p.key));
    for (const perm of targetPerms) {
      const exists = await rolePermissionRepository.findOne({
        where: { role, permissionId: perm.id },
      });
      if (!exists) {
        const rp = rolePermissionRepository.create({
          role,
          permissionId: perm.id,
        });
        await rolePermissionRepository.save(rp);
        console.log(`✅ Grant permission ${perm.key} to role ${role}`);
      }
    }
  };

  // MASTER: 모든 핵심 권한
  await ensureRolePermissions(UserRole.MASTER, [
    'MANAGE_PERMISSIONS',
    'MANAGE_USERS',
    'APPROVE_CUSTOMER',
    'APPROVE_ACCESS_REQUEST',
  ]);

  // ADMIN: 사용자 관리 + 승인 관련
  await ensureRolePermissions(UserRole.ADMIN, [
    'MANAGE_USERS',
    'APPROVE_CUSTOMER',
    'APPROVE_ACCESS_REQUEST',
  ]);

  // MANAGER: 고객 승인 + 사용자 관리(팀원 한정)
  await ensureRolePermissions(UserRole.MANAGER, ['APPROVE_CUSTOMER', 'MANAGE_USERS']);

  // STAFF: 사용자 관리(본인 계정 한정 - 비밀번호 변경)
  await ensureRolePermissions(UserRole.STAFF, ['MANAGE_USERS']);

  console.log('✨ Database seeding completed!');
}

