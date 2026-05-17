import { reservationCustomerSchema } from "./reservationCustomerSchema";

describe("reservationCustomerSchema", () => {
  it("normalizes optional and formatted customer fields", () => {
    expect(
      reservationCustomerSchema.parse({
        allergyNote: "",
        anniversaryDate: "",
        anniversaryType: "",
        customerName: " 홍길동 ",
        email: "",
        marketingConsent: false,
        phoneNumber: "010-1234-5678",
        privacyConsent: true,
        requestNotes: "",
        requestTemplateValues: [],
      }),
    ).toEqual({
      allergyNote: null,
      anniversaryDate: null,
      anniversaryType: null,
      customerName: "홍길동",
      email: null,
      marketingConsent: false,
      phoneNumber: "01012345678",
      privacyConsent: true,
      requestNotes: null,
      requestTemplateValues: [],
    });
  });

  it("normalizes optional crm fields when provided", () => {
    expect(
      reservationCustomerSchema.parse({
        allergyNote: " 견과류 ",
        anniversaryDate: "05-17",
        anniversaryType: "BIRTHDAY",
        customerName: "홍길동",
        email: "",
        marketingConsent: true,
        phoneNumber: "01012345678",
        privacyConsent: true,
        requestNotes: "창가 좌석",
        requestTemplateValues: ["조용한 좌석 선호", "기념일 방문"],
      }),
    ).toMatchObject({
      allergyNote: "견과류",
      anniversaryDate: "05-17",
      anniversaryType: "BIRTHDAY",
      marketingConsent: true,
      requestTemplateValues: ["조용한 좌석 선호", "기념일 방문"],
    });
  });

  it("validates anniversary date shape", () => {
    expect(() =>
      reservationCustomerSchema.parse({
        customerName: "홍길동",
        email: "",
        marketingConsent: false,
        phoneNumber: "01012345678",
        privacyConsent: true,
        requestNotes: "",
        anniversaryDate: "5월 17일",
        requestTemplateValues: [],
      }),
    ).toThrow("기념일 날짜는 MM-DD 또는 YYYY-MM-DD 형식으로 입력해 주세요.");
  });
});
