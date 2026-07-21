-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'BURSAR', 'PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PENDING', 'GRADUATED', 'TRANSFERRED', 'DROPPED_OUT', 'SUSPENDED', 'EXPELLED', 'PROMOTED');

-- CreateEnum
CREATE TYPE "BoardingStatus" AS ENUM ('DAY_SCHOLAR', 'BOARDER');

-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHING', 'NON_TEACHING', 'SUPPORT', 'ANCILLARY');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('SCHOOL_PAID', 'PSC', 'PART_TIME', 'VOLUNTEER', 'CONTRACT');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PERMANENT', 'CONTRACT', 'TEMPORARY', 'PART_TIME');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('GOVERNMENT', 'MISSION', 'PRIVATE', 'COUNCIL', 'GROUP_A', 'GROUP_B');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('GOVERNMENT', 'CHURCH', 'PRIVATE', 'LOCAL_AUTHORITY', 'TRUST');

-- CreateEnum
CREATE TYPE "SchoolLevelType" AS ENUM ('PRIMARY', 'SECONDARY', 'COMBINED');

-- CreateEnum
CREATE TYPE "AcademicLevel" AS ENUM ('ECD', 'PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'PENDING', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'ZiG');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ECOCASH', 'ONEMONEY', 'INNBUCKS', 'ZIMSWITCH', 'BANK_TRANSFER', 'PAYNOW');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('DAILY', 'PERIOD', 'SUBJECT', 'EVENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'EMAIL', 'PUSH', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('SMS', 'EMAIL', 'PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "BeamStatus" AS ENUM ('APPLIED', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEW', 'DISPOSED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'PERSONAL', 'STUDY', 'UNPAID', 'COMPASSIONATE');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('ON_CAMPUS', 'OFF_CAMPUS');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CURRENT', 'SAVINGS');

-- CreateEnum
CREATE TYPE "ExamLevel" AS ENUM ('GRADE_7', 'O_LEVEL', 'A_LEVEL');

-- CreateEnum
CREATE TYPE "ZimsecRegistrationStatus" AS ENUM ('PENDING', 'REGISTERED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportCardStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'COUNTERSIGNED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('TEST', 'EXAM', 'ASSIGNMENT', 'PROJECT', 'PRACTICAL', 'CONTINUOUS', 'MID_TERM', 'MIDTERM', 'FINAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'GENERATED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CanteenCategory" AS ENUM ('FOOD', 'DRINKS', 'SNACKS', 'STATIONERY', 'UNIFORM', 'OTHER');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('STUDENT', 'STAFF', 'VISITOR', 'PARENT');

-- CreateEnum
CREATE TYPE "CanteenTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PDF', 'DOC', 'XLS', 'IMG', 'PPT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'ADMISSIONS', 'ACADEMICS', 'FINANCE', 'HR', 'BOARDING', 'LEGAL', 'CORRESPONDENCE', 'REPORTS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('DONATION', 'SPONSORSHIP', 'EVENT', 'MEMBERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('NOTES', 'VIDEO', 'WORKSHEET', 'PAST_EXAM_PAPER', 'LINK', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('OPEN', 'CLOSED', 'GRADING');

-- CreateEnum
CREATE TYPE "PartnerCategory" AS ENUM ('ACCREDITATION', 'PARTNER', 'AFFILIATION');

-- CreateEnum
CREATE TYPE "ShopOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'COLLECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "motto" TEXT,
    "logo" TEXT,
    "zimsecCentreNumber" TEXT,
    "mopseDistrict" TEXT,
    "province" TEXT NOT NULL,
    "schoolType" "SchoolType" NOT NULL DEFAULT 'GOVERNMENT',
    "ownershipType" "OwnershipType" NOT NULL DEFAULT 'GOVERNMENT',
    "levelType" "SchoolLevelType" NOT NULL DEFAULT 'PRIMARY',
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "headName" TEXT,
    "deputyHeadName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "physicalAddress" TEXT,
    "gpsLatitude" TEXT,
    "gpsLongitude" TEXT,
    "catchmentArea" TEXT,
    "responsibleAuthority" TEXT,
    "establishedYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankBranch" TEXT,
    "taxNumber" TEXT,
    "nssaNumber" TEXT,
    "zimdefNumber" TEXT,
    "sdcChairperson" TEXT,
    "sdcSecretary" TEXT,
    "sdcTreasurer" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'SMS',
    "recipients" INTEGER NOT NULL DEFAULT 1,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'DELIVERED',
    "deliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "phone" TEXT,
    "eventType" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "channels" TEXT NOT NULL DEFAULT 'SMS',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "openingDate" TIMESTAMPTZ(3),
    "closingDate" TIMESTAMPTZ(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "AcademicLevel" NOT NULL DEFAULT 'PRIMARY',
    "sequence" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stream" TEXT,
    "academicYear" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "classTeacherId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "isPractical" BOOLEAN NOT NULL DEFAULT false,
    "passMark" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeSubject" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isCompulsory" BOOLEAN NOT NULL DEFAULT true,
    "periodsPerWeek" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "GradeSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "preferredName" TEXT,
    "dateOfBirth" TIMESTAMPTZ(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthCertNumber" TEXT,
    "nationalId" TEXT,
    "passportNumber" TEXT,
    "photo" TEXT,
    "religion" TEXT,
    "homeLanguage" TEXT,
    "languagePreference" TEXT NOT NULL DEFAULT 'ENGLISH',
    "nationality" TEXT NOT NULL DEFAULT 'Zimbabwean',
    "bloodGroup" TEXT,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "medications" TEXT,
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "boardingStatus" "BoardingStatus",
    "beamStatus" "BeamStatus",
    "isSpecialNeeds" BOOLEAN NOT NULL DEFAULT false,
    "specialNeedsDetails" TEXT,
    "previousSchool" TEXT,
    "admissionDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferDate" TIMESTAMPTZ(3),
    "exitDate" TIMESTAMPTZ(3),
    "exitReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationalId" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "address" TEXT,
    "employer" TEXT,
    "occupation" TEXT,
    "preferredContact" "ContactChannel" NOT NULL DEFAULT 'SMS',
    "isFeeResponsible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentParent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isFeeResponsible" BOOLEAN NOT NULL DEFAULT false,
    "hasPickupPermission" BOOLEAN NOT NULL DEFAULT true,
    "hasCustody" BOOLEAN NOT NULL DEFAULT true,
    "custodyRestrictions" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitDate" TIMESTAMPTZ(3),
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffNumber" TEXT NOT NULL,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "nationalId" TEXT,
    "dateOfBirth" TIMESTAMPTZ(3),
    "gender" "Gender",
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "nextOfKin" TEXT,
    "nextOfKinPhone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "staffType" "StaffType" NOT NULL DEFAULT 'TEACHING',
    "payType" "PayType" NOT NULL DEFAULT 'SCHOOL_PAID',
    "qualifications" TEXT,
    "subjectSpecialisation" TEXT,
    "employmentDate" TIMESTAMPTZ(3),
    "contractType" "ContractType" NOT NULL DEFAULT 'PERMANENT',
    "payrollStatus" "PayrollStatus" NOT NULL DEFAULT 'ACTIVE',
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "nssaNumber" TEXT,
    "taxNumber" TEXT,
    "basicSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "housingAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transportAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "responsibilityAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "photo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnWebsite" BOOLEAN NOT NULL DEFAULT false,
    "websiteBio" TEXT,
    "websiteOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "termId" TEXT NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "attendanceType" "AttendanceType" NOT NULL DEFAULT 'DAILY',
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT,
    "name" TEXT NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'TEST',
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "date" TIMESTAMPTZ(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentMark" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AssessmentMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "overallGrade" TEXT,
    "overallPosition" INTEGER,
    "classTeacherComment" TEXT,
    "headComment" TEXT,
    "attendanceDays" INTEGER,
    "daysPresent" INTEGER,
    "status" "ReportCardStatus" NOT NULL DEFAULT 'DRAFT',
    "classTeacherSignedAt" TIMESTAMPTZ(3),
    "headSignedAt" TIMESTAMPTZ(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "termId" TEXT,
    "name" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeInvoice" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "amountPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL,
    "dueDate" TIMESTAMPTZ(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "lateFeeApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "FeeInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "feeType" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "parentId" TEXT,
    "schoolId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(15,6) NOT NULL DEFAULT 1,
    "reference" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "allocatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "branch" TEXT,
    "branchCode" TEXT,
    "accountType" "AccountType" NOT NULL DEFAULT 'CURRENT',
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(15,2),
    "donor" TEXT,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZimsecCandidate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "centreNumber" TEXT,
    "candidateNumber" TEXT,
    "examLevel" "ExamLevel" NOT NULL,
    "examYear" INTEGER NOT NULL,
    "registrationStatus" "ZimsecRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "subjects" TEXT,
    "totalFees" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feesPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ZimsecCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeamApplication" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BeamStatus" NOT NULL DEFAULT 'APPLIED',
    "coveredAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "socialWelfareRef" TEXT,
    "guardianSituation" TEXT,
    "orphanStatus" TEXT,
    "notes" TEXT,
    "coverageAppliedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BeamApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "actionTaken" TEXT,
    "referredTo" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "WelfareRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplineRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "action" TEXT,
    "meritPoints" INTEGER NOT NULL DEFAULT 0,
    "demeritPoints" INTEGER NOT NULL DEFAULT 0,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DisciplineRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "visitType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "treatment" TEXT,
    "medicationGiven" TEXT,
    "referredTo" TEXT,
    "visitDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dormitory" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Dormitory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardingAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dormitoryId" TEXT NOT NULL,
    "bedNumber" TEXT,
    "startDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMPTZ(3),
    "status" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BoardingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "capacity" INTEGER,
    "driverName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "pickupPoint" TEXT,
    "dropoffPoint" TEXT,
    "startDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMPTZ(3),
    "status" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "TransportAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryBook" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "category" TEXT,
    "shelfLocation" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "LibraryBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryTransaction" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "issueDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMPTZ(3),
    "returnDate" TIMESTAMPTZ(3),
    "fine" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "conditionOnReturn" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "LibraryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "purchaseCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "purchaseDate" TIMESTAMPTZ(3),
    "donorSource" TEXT,
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "custodian" TEXT,
    "isDisposed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "schoolId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedCost" DECIMAL(15,2),
    "actualCost" DECIMAL(15,2),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "basicSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "housingAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transportAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "responsibilityAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossPay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paye" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "nssaEmployee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "nssaEmployer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "aidsLevy" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "zimdef" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pension" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "medicalAid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "funeralPolicy" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "LeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalRecord" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "strengths" TEXT,
    "areasForImprovement" TEXT,
    "goals" TEXT,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppraisalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDiscipline" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "action" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "StaffDiscipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SDCMember" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "termStart" TIMESTAMPTZ(3),
    "termEnd" TIMESTAMPTZ(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SDCMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "parentId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'SMS',
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3),
    "venue" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SchoolEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "meetingDay" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsCode" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SportsCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "House" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colour" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "staffId" TEXT,
    "studentId" TEXT,
    "parentId" TEXT,
    "schoolId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "performedBy" TEXT,
    "actorId" TEXT,
    "details" TEXT,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "response" JSONB,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitWindow" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RateLimitWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CanteenCategory" NOT NULL DEFAULT 'FOOD',
    "price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CanteenItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenTransaction" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "buyerType" "BuyerType" NOT NULL DEFAULT 'STUDENT',
    "buyerId" TEXT,
    "buyerName" TEXT NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "CanteenTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CanteenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenTransactionItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CanteenTransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "supplierId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "orderDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requisition" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestedBy" TEXT,
    "department" TEXT,
    "estimatedCost" DECIMAL(15,2),
    "status" "RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL DEFAULT 'PDF',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT,
    "tags" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumni" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "occupation" TEXT,
    "company" TEXT,
    "location" TEXT,
    "isNotable" BOOLEAN NOT NULL DEFAULT false,
    "totalContributions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniContribution" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "contributionType" "ContributionType" NOT NULL DEFAULT 'DONATION',
    "description" TEXT,
    "campaign" TEXT,
    "date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AlumniContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idNumber" TEXT,
    "purpose" TEXT NOT NULL,
    "hostPerson" TEXT,
    "vehicleReg" TEXT,
    "phone" TEXT,
    "checkInTime" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMPTZ(3),
    "status" "VisitorStatus" NOT NULL DEFAULT 'ON_CAMPUS',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "location" TEXT,
    "severity" "Severity" NOT NULL DEFAULT 'LOW',
    "description" TEXT NOT NULL,
    "reporter" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructor" TEXT,
    "enrollmentCount" INTEGER NOT NULL DEFAULT 0,
    "syllabusCompletion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseResource" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL DEFAULT 'NOTES',
    "url" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CourseResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAssignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "dueDate" TIMESTAMPTZ(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'OPEN',
    "submissionsCount" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffId" TEXT,
    "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "period" INTEGER NOT NULL DEFAULT 1,
    "room" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsitePage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "heroImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "schemaMarkup" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "showInNavigation" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "WebsitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "authorName" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMPTZ(3),
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "category" "PartnerCategory" NOT NULL DEFAULT 'PARTNER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteTheme" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#047857',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0f766e',
    "accentColor" TEXT NOT NULL DEFAULT '#facc15',
    "darkColor" TEXT NOT NULL DEFAULT '#022c22',
    "headingFont" TEXT NOT NULL DEFAULT 'Geist',
    "bodyFont" TEXT NOT NULL DEFAULT 'Geist',
    "radius" TEXT NOT NULL DEFAULT '0.75rem',
    "heroImageUrl" TEXT NOT NULL DEFAULT '/images/campus-hero.jpg',
    "heroBadge" TEXT,
    "heroHeadline" TEXT,
    "heroMotto" TEXT,
    "heroSubtitle" TEXT,
    "heroPrimaryLabel" TEXT NOT NULL DEFAULT 'Apply for Admission',
    "heroPrimaryHref" TEXT NOT NULL DEFAULT '/admissions/apply',
    "heroSecondaryLabel" TEXT NOT NULL DEFAULT 'Discover Our School',
    "heroSecondaryHref" TEXT NOT NULL DEFAULT '/about',
    "overlayFrom" TEXT NOT NULL DEFAULT '#022c22',
    "overlayTo" TEXT NOT NULL DEFAULT '#134e4a',
    "overlayOpacity" INTEGER NOT NULL DEFAULT 80,
    "statsJson" TEXT NOT NULL DEFAULT '[]',
    "valuesJson" TEXT NOT NULL DEFAULT '[]',
    "testimonialsJson" TEXT NOT NULL DEFAULT '[]',
    "aboutHistory" TEXT,
    "missionText" TEXT,
    "visionText" TEXT,
    "showStats" BOOLEAN NOT NULL DEFAULT true,
    "showPartners" BOOLEAN NOT NULL DEFAULT true,
    "showValues" BOOLEAN NOT NULL DEFAULT true,
    "showGallery" BOOLEAN NOT NULL DEFAULT true,
    "showTestimonials" BOOLEAN NOT NULL DEFAULT true,
    "showNews" BOOLEAN NOT NULL DEFAULT true,
    "showEvents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SiteTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolShopItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'UNIFORM',
    "price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "imageUrl" TEXT,
    "sizes" TEXT,
    "colors" TEXT,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SchoolShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolShopOrder" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "studentId" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "items" TEXT NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "ShopOrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SchoolShopOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOSetting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pageSlug" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "schemaMarkup" TEXT,
    "canonicalUrl" TEXT,
    "robotsDirective" TEXT NOT NULL DEFAULT 'index, follow',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SEOSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSetting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE INDEX "NotificationLog_schoolId_createdAt_idx" ON "NotificationLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_deletedAt_idx" ON "NotificationLog"("deletedAt");

-- CreateIndex
CREATE INDEX "NotificationTemplate_schoolId_idx" ON "NotificationTemplate"("schoolId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_deletedAt_idx" ON "NotificationTemplate"("deletedAt");

-- CreateIndex
CREATE INDEX "AcademicYear_deletedAt_idx" ON "AcademicYear"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_schoolId_name_key" ON "AcademicYear"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Term_deletedAt_idx" ON "Term"("deletedAt");

-- CreateIndex
CREATE INDEX "Term_schoolId_idx" ON "Term"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Term_academicYearId_termNumber_key" ON "Term"("academicYearId", "termNumber");

-- CreateIndex
CREATE INDEX "Grade_deletedAt_idx" ON "Grade"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_schoolId_name_key" ON "Grade"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Class_deletedAt_idx" ON "Class"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_gradeId_name_academicYear_key" ON "Class"("schoolId", "gradeId", "name", "academicYear");

-- CreateIndex
CREATE INDEX "Subject_deletedAt_idx" ON "Subject"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject"("schoolId", "code");

-- CreateIndex
CREATE INDEX "GradeSubject_deletedAt_idx" ON "GradeSubject"("deletedAt");

-- CreateIndex
CREATE INDEX "GradeSubject_schoolId_idx" ON "GradeSubject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeSubject_gradeId_subjectId_key" ON "GradeSubject"("gradeId", "subjectId");

-- CreateIndex
CREATE INDEX "Department_deletedAt_idx" ON "Department"("deletedAt");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- CreateIndex
CREATE INDEX "Student_enrollmentStatus_idx" ON "Student"("enrollmentStatus");

-- CreateIndex
CREATE INDEX "Student_schoolId_enrollmentStatus_idx" ON "Student"("schoolId", "enrollmentStatus");

-- CreateIndex
CREATE INDEX "Student_deletedAt_idx" ON "Student"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_studentNumber_key" ON "Student"("schoolId", "studentNumber");

-- CreateIndex
CREATE INDEX "Parent_schoolId_idx" ON "Parent"("schoolId");

-- CreateIndex
CREATE INDEX "Parent_phone_idx" ON "Parent"("phone");

-- CreateIndex
CREATE INDEX "Parent_deletedAt_idx" ON "Parent"("deletedAt");

-- CreateIndex
CREATE INDEX "StudentParent_deletedAt_idx" ON "StudentParent"("deletedAt");

-- CreateIndex
CREATE INDEX "StudentParent_schoolId_idx" ON "StudentParent"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentParent_studentId_parentId_key" ON "StudentParent"("studentId", "parentId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_classId_academicYearId_idx" ON "StudentEnrollment"("classId", "academicYearId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_deletedAt_idx" ON "StudentEnrollment"("deletedAt");

-- CreateIndex
CREATE INDEX "StudentEnrollment_schoolId_idx" ON "StudentEnrollment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_studentId_academicYearId_key" ON "StudentEnrollment"("studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "Staff_deletedAt_idx" ON "Staff"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_schoolId_staffNumber_key" ON "Staff"("schoolId", "staffNumber");

-- CreateIndex
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE INDEX "Attendance_termId_idx" ON "Attendance"("termId");

-- CreateIndex
CREATE INDEX "Attendance_termId_date_idx" ON "Attendance"("termId", "date");

-- CreateIndex
CREATE INDEX "Attendance_deletedAt_idx" ON "Attendance"("deletedAt");

-- CreateIndex
CREATE INDEX "Attendance_schoolId_idx" ON "Attendance"("schoolId");

-- CreateIndex
CREATE INDEX "Assessment_deletedAt_idx" ON "Assessment"("deletedAt");

-- CreateIndex
CREATE INDEX "AssessmentMark_studentId_idx" ON "AssessmentMark"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentMark_deletedAt_idx" ON "AssessmentMark"("deletedAt");

-- CreateIndex
CREATE INDEX "AssessmentMark_schoolId_idx" ON "AssessmentMark"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentMark_assessmentId_studentId_key" ON "AssessmentMark"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "ReportCard_classId_termId_idx" ON "ReportCard"("classId", "termId");

-- CreateIndex
CREATE INDEX "ReportCard_deletedAt_idx" ON "ReportCard"("deletedAt");

-- CreateIndex
CREATE INDEX "ReportCard_schoolId_idx" ON "ReportCard"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_studentId_termId_key" ON "ReportCard"("studentId", "termId");

-- CreateIndex
CREATE INDEX "FeeStructure_deletedAt_idx" ON "FeeStructure"("deletedAt");

-- CreateIndex
CREATE INDEX "FeeInvoice_studentId_status_idx" ON "FeeInvoice"("studentId", "status");

-- CreateIndex
CREATE INDEX "FeeInvoice_termId_idx" ON "FeeInvoice"("termId");

-- CreateIndex
CREATE INDEX "FeeInvoice_deletedAt_idx" ON "FeeInvoice"("deletedAt");

-- CreateIndex
CREATE INDEX "FeeInvoice_schoolId_idx" ON "FeeInvoice"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeInvoice_schoolId_invoiceNumber_key" ON "FeeInvoice"("schoolId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceItem_deletedAt_idx" ON "InvoiceItem"("deletedAt");

-- CreateIndex
CREATE INDEX "InvoiceItem_schoolId_idx" ON "InvoiceItem"("schoolId");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_idx" ON "FeePayment"("studentId");

-- CreateIndex
CREATE INDEX "FeePayment_invoiceId_idx" ON "FeePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "FeePayment_parentId_idx" ON "FeePayment"("parentId");

-- CreateIndex
CREATE INDEX "FeePayment_deletedAt_idx" ON "FeePayment"("deletedAt");

-- CreateIndex
CREATE INDEX "FeePayment_schoolId_idx" ON "FeePayment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_schoolId_receiptNumber_key" ON "FeePayment"("schoolId", "receiptNumber");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_schoolId_idx" ON "PaymentAllocation"("schoolId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_deletedAt_idx" ON "PaymentAllocation"("deletedAt");

-- CreateIndex
CREATE INDEX "BankAccount_deletedAt_idx" ON "BankAccount"("deletedAt");

-- CreateIndex
CREATE INDEX "Scholarship_deletedAt_idx" ON "Scholarship"("deletedAt");

-- CreateIndex
CREATE INDEX "Scholarship_schoolId_idx" ON "Scholarship"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ZimsecCandidate_studentId_key" ON "ZimsecCandidate"("studentId");

-- CreateIndex
CREATE INDEX "ZimsecCandidate_deletedAt_idx" ON "ZimsecCandidate"("deletedAt");

-- CreateIndex
CREATE INDEX "ZimsecCandidate_schoolId_idx" ON "ZimsecCandidate"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "BeamApplication_studentId_key" ON "BeamApplication"("studentId");

-- CreateIndex
CREATE INDEX "BeamApplication_deletedAt_idx" ON "BeamApplication"("deletedAt");

-- CreateIndex
CREATE INDEX "BeamApplication_schoolId_idx" ON "BeamApplication"("schoolId");

-- CreateIndex
CREATE INDEX "WelfareRecord_deletedAt_idx" ON "WelfareRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "WelfareRecord_schoolId_idx" ON "WelfareRecord"("schoolId");

-- CreateIndex
CREATE INDEX "DisciplineRecord_deletedAt_idx" ON "DisciplineRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "DisciplineRecord_schoolId_idx" ON "DisciplineRecord"("schoolId");

-- CreateIndex
CREATE INDEX "HealthRecord_deletedAt_idx" ON "HealthRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "HealthRecord_schoolId_idx" ON "HealthRecord"("schoolId");

-- CreateIndex
CREATE INDEX "Hostel_deletedAt_idx" ON "Hostel"("deletedAt");

-- CreateIndex
CREATE INDEX "Dormitory_deletedAt_idx" ON "Dormitory"("deletedAt");

-- CreateIndex
CREATE INDEX "Dormitory_schoolId_idx" ON "Dormitory"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardingAssignment_studentId_key" ON "BoardingAssignment"("studentId");

-- CreateIndex
CREATE INDEX "BoardingAssignment_deletedAt_idx" ON "BoardingAssignment"("deletedAt");

-- CreateIndex
CREATE INDEX "BoardingAssignment_schoolId_idx" ON "BoardingAssignment"("schoolId");

-- CreateIndex
CREATE INDEX "TransportRoute_deletedAt_idx" ON "TransportRoute"("deletedAt");

-- CreateIndex
CREATE INDEX "Vehicle_deletedAt_idx" ON "Vehicle"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransportAssignment_studentId_key" ON "TransportAssignment"("studentId");

-- CreateIndex
CREATE INDEX "TransportAssignment_deletedAt_idx" ON "TransportAssignment"("deletedAt");

-- CreateIndex
CREATE INDEX "TransportAssignment_schoolId_idx" ON "TransportAssignment"("schoolId");

-- CreateIndex
CREATE INDEX "LibraryBook_deletedAt_idx" ON "LibraryBook"("deletedAt");

-- CreateIndex
CREATE INDEX "LibraryTransaction_deletedAt_idx" ON "LibraryTransaction"("deletedAt");

-- CreateIndex
CREATE INDEX "LibraryTransaction_schoolId_idx" ON "LibraryTransaction"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");

-- CreateIndex
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_deletedAt_idx" ON "MaintenanceRequest"("deletedAt");

-- CreateIndex
CREATE INDEX "Payslip_deletedAt_idx" ON "Payslip"("deletedAt");

-- CreateIndex
CREATE INDEX "Payslip_schoolId_idx" ON "Payslip"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_staffId_periodMonth_periodYear_key" ON "Payslip"("staffId", "periodMonth", "periodYear");

-- CreateIndex
CREATE INDEX "LeaveRecord_deletedAt_idx" ON "LeaveRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "LeaveRecord_schoolId_idx" ON "LeaveRecord"("schoolId");

-- CreateIndex
CREATE INDEX "AppraisalRecord_deletedAt_idx" ON "AppraisalRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "AppraisalRecord_schoolId_idx" ON "AppraisalRecord"("schoolId");

-- CreateIndex
CREATE INDEX "StaffDiscipline_deletedAt_idx" ON "StaffDiscipline"("deletedAt");

-- CreateIndex
CREATE INDEX "StaffDiscipline_schoolId_idx" ON "StaffDiscipline"("schoolId");

-- CreateIndex
CREATE INDEX "SDCMember_deletedAt_idx" ON "SDCMember"("deletedAt");

-- CreateIndex
CREATE INDEX "Communication_deletedAt_idx" ON "Communication"("deletedAt");

-- CreateIndex
CREATE INDEX "SchoolEvent_deletedAt_idx" ON "SchoolEvent"("deletedAt");

-- CreateIndex
CREATE INDEX "Club_deletedAt_idx" ON "Club"("deletedAt");

-- CreateIndex
CREATE INDEX "SportsCode_deletedAt_idx" ON "SportsCode"("deletedAt");

-- CreateIndex
CREATE INDEX "House_deletedAt_idx" ON "House"("deletedAt");

-- CreateIndex
CREATE INDEX "Supplier_deletedAt_idx" ON "Supplier"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffId_key" ON "User"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_parentId_key" ON "User"("parentId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_deletedAt_idx" ON "AuditLog"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_idx" ON "AuditLog"("schoolId");

-- CreateIndex
CREATE INDEX "Outbox_status_scheduledAt_idx" ON "Outbox"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Outbox_schoolId_idx" ON "Outbox"("schoolId");

-- CreateIndex
CREATE INDEX "Outbox_deletedAt_idx" ON "Outbox"("deletedAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_scope_key_key" ON "IdempotencyKey"("scope", "key");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitWindow_key_key" ON "RateLimitWindow"("key");

-- CreateIndex
CREATE INDEX "RateLimitWindow_windowStart_idx" ON "RateLimitWindow"("windowStart");

-- CreateIndex
CREATE INDEX "CanteenItem_deletedAt_idx" ON "CanteenItem"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenTransaction_transactionNumber_key" ON "CanteenTransaction"("transactionNumber");

-- CreateIndex
CREATE INDEX "CanteenTransaction_deletedAt_idx" ON "CanteenTransaction"("deletedAt");

-- CreateIndex
CREATE INDEX "CanteenTransactionItem_deletedAt_idx" ON "CanteenTransactionItem"("deletedAt");

-- CreateIndex
CREATE INDEX "CanteenTransactionItem_schoolId_idx" ON "CanteenTransactionItem"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_deletedAt_idx" ON "PurchaseOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_deletedAt_idx" ON "PurchaseOrderItem"("deletedAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_schoolId_idx" ON "PurchaseOrderItem"("schoolId");

-- CreateIndex
CREATE INDEX "Requisition_deletedAt_idx" ON "Requisition"("deletedAt");

-- CreateIndex
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");

-- CreateIndex
CREATE INDEX "Alumni_deletedAt_idx" ON "Alumni"("deletedAt");

-- CreateIndex
CREATE INDEX "AlumniContribution_deletedAt_idx" ON "AlumniContribution"("deletedAt");

-- CreateIndex
CREATE INDEX "AlumniContribution_schoolId_idx" ON "AlumniContribution"("schoolId");

-- CreateIndex
CREATE INDEX "Visitor_deletedAt_idx" ON "Visitor"("deletedAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_deletedAt_idx" ON "SecurityIncident"("deletedAt");

-- CreateIndex
CREATE INDEX "Course_deletedAt_idx" ON "Course"("deletedAt");

-- CreateIndex
CREATE INDEX "CourseResource_deletedAt_idx" ON "CourseResource"("deletedAt");

-- CreateIndex
CREATE INDEX "CourseResource_schoolId_idx" ON "CourseResource"("schoolId");

-- CreateIndex
CREATE INDEX "CourseAssignment_deletedAt_idx" ON "CourseAssignment"("deletedAt");

-- CreateIndex
CREATE INDEX "CourseAssignment_schoolId_idx" ON "CourseAssignment"("schoolId");

-- CreateIndex
CREATE INDEX "TimetableEntry_deletedAt_idx" ON "TimetableEntry"("deletedAt");

-- CreateIndex
CREATE INDEX "WebsitePage_deletedAt_idx" ON "WebsitePage"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebsitePage_schoolId_slug_key" ON "WebsitePage"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "NewsArticle_deletedAt_idx" ON "NewsArticle"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_schoolId_slug_key" ON "NewsArticle"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "GalleryImage_deletedAt_idx" ON "GalleryImage"("deletedAt");

-- CreateIndex
CREATE INDEX "Partner_schoolId_isActive_idx" ON "Partner"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "Partner_deletedAt_idx" ON "Partner"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteTheme_schoolId_key" ON "SiteTheme"("schoolId");

-- CreateIndex
CREATE INDEX "SiteTheme_deletedAt_idx" ON "SiteTheme"("deletedAt");

-- CreateIndex
CREATE INDEX "Faq_schoolId_isActive_idx" ON "Faq"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "Faq_deletedAt_idx" ON "Faq"("deletedAt");

-- CreateIndex
CREATE INDEX "SchoolShopItem_deletedAt_idx" ON "SchoolShopItem"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolShopOrder_orderNumber_key" ON "SchoolShopOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "SchoolShopOrder_deletedAt_idx" ON "SchoolShopOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "SEOSetting_deletedAt_idx" ON "SEOSetting"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SEOSetting_schoolId_pageSlug_key" ON "SEOSetting"("schoolId", "pageSlug");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "SchoolSetting_schoolId_category_idx" ON "SchoolSetting"("schoolId", "category");

-- CreateIndex
CREATE INDEX "SchoolSetting_deletedAt_idx" ON "SchoolSetting"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSetting_schoolId_key_key" ON "SchoolSetting"("schoolId", "key");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeSubject" ADD CONSTRAINT "GradeSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeSubject" ADD CONSTRAINT "GradeSubject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeSubject" ADD CONSTRAINT "GradeSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMark" ADD CONSTRAINT "AssessmentMark_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMark" ADD CONSTRAINT "AssessmentMark_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMark" ADD CONSTRAINT "AssessmentMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZimsecCandidate" ADD CONSTRAINT "ZimsecCandidate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZimsecCandidate" ADD CONSTRAINT "ZimsecCandidate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeamApplication" ADD CONSTRAINT "BeamApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeamApplication" ADD CONSTRAINT "BeamApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRecord" ADD CONSTRAINT "WelfareRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRecord" ADD CONSTRAINT "WelfareRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplineRecord" ADD CONSTRAINT "DisciplineRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplineRecord" ADD CONSTRAINT "DisciplineRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dormitory" ADD CONSTRAINT "Dormitory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dormitory" ADD CONSTRAINT "Dormitory_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingAssignment" ADD CONSTRAINT "BoardingAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingAssignment" ADD CONSTRAINT "BoardingAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingAssignment" ADD CONSTRAINT "BoardingAssignment_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAssignment" ADD CONSTRAINT "TransportAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAssignment" ADD CONSTRAINT "TransportAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAssignment" ADD CONSTRAINT "TransportAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBook" ADD CONSTRAINT "LibraryBook_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTransaction" ADD CONSTRAINT "LibraryTransaction_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTransaction" ADD CONSTRAINT "LibraryTransaction_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "LibraryBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTransaction" ADD CONSTRAINT "LibraryTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalRecord" ADD CONSTRAINT "AppraisalRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalRecord" ADD CONSTRAINT "AppraisalRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDiscipline" ADD CONSTRAINT "StaffDiscipline_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDiscipline" ADD CONSTRAINT "StaffDiscipline_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SDCMember" ADD CONSTRAINT "SDCMember_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolEvent" ADD CONSTRAINT "SchoolEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsCode" ADD CONSTRAINT "SportsCode_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "House" ADD CONSTRAINT "House_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenItem" ADD CONSTRAINT "CanteenItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenTransaction" ADD CONSTRAINT "CanteenTransaction_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenTransactionItem" ADD CONSTRAINT "CanteenTransactionItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenTransactionItem" ADD CONSTRAINT "CanteenTransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "CanteenTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenTransactionItem" ADD CONSTRAINT "CanteenTransactionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CanteenItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumni" ADD CONSTRAINT "Alumni_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniContribution" ADD CONSTRAINT "AlumniContribution_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniContribution" ADD CONSTRAINT "AlumniContribution_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityIncident" ADD CONSTRAINT "SecurityIncident_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseResource" ADD CONSTRAINT "CourseResource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseResource" ADD CONSTRAINT "CourseResource_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsitePage" ADD CONSTRAINT "WebsitePage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteTheme" ADD CONSTRAINT "SiteTheme_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolShopItem" ADD CONSTRAINT "SchoolShopItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolShopOrder" ADD CONSTRAINT "SchoolShopOrder_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOSetting" ADD CONSTRAINT "SEOSetting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSetting" ADD CONSTRAINT "SchoolSetting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Identity model guard: a User can be linked to at most one of Staff/Student/Parent.
-- System admins (no linked identity) are permitted; parent/student/staff users must
-- have exactly one. This is enforced at the DB level to keep the polymorphic link
-- unambiguous.
ALTER TABLE "User" ADD CONSTRAINT "User_identity_check"
  CHECK (num_nonnulls("staffId"::text, "studentId"::text, "parentId"::text) <= 1);

