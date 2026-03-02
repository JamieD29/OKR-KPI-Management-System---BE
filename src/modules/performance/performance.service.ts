import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KpiCategory } from '../../database/entities/performance/kpi-category.entity';
import { KpiTemplate } from '../../database/entities/performance/kpi-template.entity';
import {
  EvaluationCycle,
  EvaluationStatus,
} from '../../database/entities/performance/evaluation-cycle.entity';

import { UserKpi } from '../../database/entities/performance/user-kpi.entity';
import { CreateUserKpiDto } from './dto/create-user-kpi.dto';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(KpiCategory)
    private categoryRepo: Repository<KpiCategory>,

    @InjectRepository(KpiTemplate)
    private templateRepo: Repository<KpiTemplate>,

    @InjectRepository(EvaluationCycle)
    private cycleRepo: Repository<EvaluationCycle>,

    @InjectRepository(UserKpi)
    private userKpiRepo: Repository<UserKpi>,
  ) {}

  async initMockData() {
    try {
      // 👇 BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ (Để tránh lỗi thiếu hụt)
      // Lưu ý: Phải xóa theo thứ tự con trước cha sau
      await this.templateRepo.createQueryBuilder().delete().execute();

      // Xóa cha (Category) sau
      await this.categoryRepo.createQueryBuilder().delete().execute();

      console.log('🧹 Đã dọn dẹp dữ liệu cũ...');
      // 1. Tạo kỳ đánh giá
      const cycleName = 'Học kỳ 1 - Năm học 2025-2026';
      const existCycle = await this.cycleRepo.findOne({ where: { name: cycleName } });

      if (!existCycle) {
        await this.cycleRepo.save({
          name: cycleName,
          status: EvaluationStatus.OPEN,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 5)),
        });
        console.log('✅ Đã tạo kỳ đánh giá mới');
      } else {
        console.log('⚠️ Kỳ đánh giá đã tồn tại, bỏ qua.');
      }

      // 2. Tạo Nhóm A
      const codeA = 'GROUP_A';
      let catA = await this.categoryRepo.findOne({ where: { code: codeA } });

      if (!catA) {
        // Lưu Category xong phải lấy biến này để dùng ID của nó
        catA = await this.categoryRepo.save({
          name: 'Nhiệm vụ giảng dạy',
          code: codeA,
          maxPointsByRole: { LECTURER: 10, DEAN: 10 },
        });

        // 👇 KHẮC PHỤC LỖI Ở ĐÂY: Thêm categoryId: catA.id
        await this.templateRepo.save([
          {
            content: 'Giờ chuẩn giảng dạy quy đổi',
            unit: 'Giờ',
            basePoint: 0.2,
            categoryId: catA.id,
          },
          { content: 'Có kế hoạch giảng dạy đúng hạn', basePoint: 10, categoryId: catA.id },
          { content: 'Hoàn thành chấm thi đúng hạn', basePoint: 3, categoryId: catA.id },
          {
            content: 'Xây dựng tài liệu giảng dạy',
            unit: 'Học phần',
            basePoint: 2,
            categoryId: catA.id,
          },
        ]);
        console.log('✅ Đã tạo Nhóm A và Template');
      } else {
        console.log('⚠️ Nhóm A đã tồn tại, bỏ qua.');
      }

      // 3. Tạo Nhóm B
      const codeB = 'GROUP_B';
      let catB = await this.categoryRepo.findOne({ where: { code: codeB } });

      if (!catB) {
        catB = await this.categoryRepo.save({
          name: 'Nhiệm vụ Nghiên cứu khoa học',
          code: codeB,
          maxPointsByRole: { LECTURER: 10, DEAN: 10 },
        });

        // 👇 KHẮC PHỤC LỖI Ở ĐÂY: Thêm categoryId: catB.id
        await this.templateRepo.save([
          {
            content: 'Bài báo khoa học nộp tạp chí',
            unit: 'Bài',
            basePoint: 10,
            categoryId: catB.id,
          },
          { content: 'Tham gia đề tài NCKH các cấp', basePoint: 10, categoryId: catB.id },
        ]);
        console.log('✅ Đã tạo Nhóm B và Template');
      } else {
        console.log('⚠️ Nhóm B đã tồn tại, bỏ qua.');
      }

      return { message: 'Đã hoàn tất kiểm tra và khởi tạo dữ liệu!' };
    } catch (error) {
      console.error('❌ LỖI KHỞI TẠO:', error);
      // Ném lỗi ra để Controller bắt được
      throw new InternalServerErrorException(error.message);
    }
  }

  async getKpiTemplate() {
    return this.categoryRepo.find({
      relations: ['templates'],
      order: { code: 'ASC' },
    });
  }

  async getCycles() {
    return this.cycleRepo.find({ order: { createdAt: 'DESC' } });
  }

  // ==========================================
  // 4. GỬI ĐÁNH GIÁ KPI (USER SUBMIT)
  // ==========================================
  // ==========================================
  // 4. GỬI ĐÁNH GIÁ KPI (USER SUBMIT)
  // ==========================================
  async submitKpi(userId: string, dto: CreateUserKpiDto) {
    const { cycleId, items } = dto;

    // 🛡️ 1. Lập chốt kiểm tra dữ liệu đầu vào (Tránh frontend gửi bậy làm sập server)
    if (!cycleId || !items || !Array.isArray(items)) {
      // Nhớ import BadRequestException ở đầu file nhé!
      throw new BadRequestException('❌ Dữ liệu không hợp lệ (Thiếu cycleId hoặc items)');
    }

    // 🧹 2. DỌN RÁC (CHỐNG LỖI NHÂN BẢN DỮ LIỆU)
    // Tìm tất cả KPI cũ của ông User này trong đúng Học kỳ này
    const existingKpis = await this.userKpiRepo.find({
      where: { userId: userId, cycleId: cycleId },
    });

    // Nếu có dữ liệu cũ -> Xóa sạch trước khi nộp bản mới
    if (existingKpis.length > 0) {
      await this.userKpiRepo.remove(existingKpis);
      console.log(`🧹 Đã xóa ${existingKpis.length} dòng bản nháp cũ của user ${userId}`);
    }

    const result: UserKpi[] = [];

    // ⚙️ 3. Xử lý và tính điểm cho từng item
    for (const item of items) {
      let calculatedScore = 0;

      // Nếu là mục từ Template (Mục cứng) -> Lấy điểm gốc để tính
      if (item.templateId) {
        const template = await this.templateRepo.findOne({ where: { id: item.templateId } });
        if (template) {
          // Ép kiểu ép số lượng (Lỡ frontend gửi null/undefined thì quy về 0)
          const qty = Number(item.quantity) || 0;
          calculatedScore = qty * template.basePoint;
        }
      }

      // 4. Tạo Entity dòng mới
      const newKpi = this.userKpiRepo.create({
        userId: userId,
        cycleId: cycleId,
        categoryId: item.categoryId,
        // Use undefined instead of null for optional fields
        templateId: item.templateId || undefined,
        content: item.content,
        quantity: Number(item.quantity) || 0,
        selfScore: calculatedScore,
        evidenceUrl: item.evidenceUrl || undefined,
        managerScore: calculatedScore, // Sếp chưa chấm thì mặc định bằng tự chấm
      });

      result.push(newKpi);
    }

    // 5. Lưu toàn bộ mảng mới vào DB
    await this.userKpiRepo.save(result);

    return {
      message: '✅ Đã lưu đánh giá thành công!',
      count: result.length,
    };
  }

  // ==========================================
  // 5. LẤY DANH SÁCH KPI CỦA TÔI (VIEW HISTORY)
  // ==========================================
  async getMyKpis(userId: string, cycleId: string) {
    return this.userKpiRepo.find({
      where: {
        userId: userId,
        cycleId: cycleId,
      },
      // 👇 Quan trọng: Join sang bảng khác để lấy thông tin chi tiết
      relations: ['template', 'category'],
      order: { createdAt: 'ASC' },
    });
  }

  // ==========================================
  // 6. MANAGER: XEM TỔNG QUAN BỘ MÔN
  // ==========================================
  async getDepartmentOverview(cycleId: string) {
    // Lấy tất cả KPI trong kỳ này, join với bảng User để biết là của ai
    const kpis = await this.userKpiRepo.find({
      where: { cycleId },
      relations: ['user'],
    });

    // Gom nhóm theo User (Vì 1 user có nhiều dòng KPI)
    // Kết quả trả về dạng: Danh sách User kèm tổng điểm
    const userMap = new Map();

    kpis.forEach((kpi) => {
      const userId = kpi.userId;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId: userId,

          name: kpi.user.name || kpi.user.email || 'Unknown',
          email: kpi.user?.email,
          totalSelfScore: 0,
          totalManagerScore: 0,
          status: kpi.status, // Lấy status của dòng đầu tiên đại diện
          submittedAt: kpi.createdAt,
        });
      }

      const userData = userMap.get(userId);
      userData.totalSelfScore += kpi.selfScore;
      userData.totalManagerScore += kpi.managerScore;
    });

    return Array.from(userMap.values());
  }

  // ==========================================
  // 7. MANAGER: DUYỆT CHI TIẾT (CHẤM ĐIỂM)
  // ==========================================
  async reviewKpi(id: string, managerScore: number, status: string, managerComment: string) {
    const kpi = await this.userKpiRepo.findOne({ where: { id } });
    if (!kpi) throw new Error('KPI không tồn tại');

    kpi.managerScore = managerScore;
    kpi.status = status as any;
    kpi.managerComment = managerComment;

    return this.userKpiRepo.save(kpi);
  }

  // ==========================================
  // 8. ADMIN: TẠO KỲ ĐÁNH GIÁ MỚI
  // ==========================================
  async createCycle(name: string, startDate: Date, endDate: Date) {
    const newCycle = this.cycleRepo.create({
      name,
      startDate,
      endDate,
      status: EvaluationStatus.OPEN, // Mặc định mở luôn
    });
    return this.cycleRepo.save(newCycle);
  }

  // ==========================================
  // 9. ADMIN: ĐỔI TRẠNG THÁI (ĐÓNG/MỞ)
  // ==========================================
  async toggleCycleStatus(id: string, status: string) {
    // 1. Kiểm tra xem kỳ có tồn tại không
    const cycle = await this.cycleRepo.findOne({ where: { id } });
    if (!cycle) throw new NotFoundException('Không tìm thấy kỳ đánh giá');

    // 2. Cập nhật trạng thái mới (OPEN / CLOSED)
    cycle.status = status as any; // Ép kiểu nếu cần

    // 3. Lưu vào DB
    await this.cycleRepo.save(cycle);

    return { message: 'Cập nhật thành công', cycle };
  }
}
