export interface Policy {
  id: string;
  type: string;
  title: string;
  slug: string;
  content: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyType {
  value: string;
  label: string;
  description: string;
}

export const policyTypes: PolicyType[] = [
  {
    value: "terms_of_service",
    label: "Үйлчилгээний нөхцөл",
    description: "Ерөнхий үйлчилгээний дүрэм, журам",
  },
  {
    value: "delivery_policy",
    label: "Хүргэлтийн нөхцөл",
    description: "Хүргэлтийн бүс, хугацаа, төлбөр",
  },
  {
    value: "return_policy",
    label: "Буцаалт, солилтын нөхцөл",
    description: "Бараа буцаах, солих журам",
  },
  {
    value: "privacy_policy",
    label: "Нууцлалын бодлого",
    description: "Хэрэглэгчийн мэдээлэл хамгаалах",
  },
  {
    value: "payment_policy",
    label: "Төлбөрийн нөхцөл",
    description: "Төлбөрийн хэлбэр, баталгаа",
  },
  {
    value: "warranty_policy",
    label: "Баталгаат хугацаа",
    description: "Барааны баталгаа",
  },
  {
    value: "order_policy",
    label: "Захиалгын нөхцөл",
    description: "Захиалга өгөх, цуцлах журам",
  },
  {
    value: "complaint_policy",
    label: "Гомдол шийдвэрлэх",
    description: "Гомдол барагдуулах журам",
  },
];

export function getPolicyTypeData(type: string): PolicyType | null {
  return policyTypes.find((p) => p.value === type) || null;
}
