import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* 히어로 섹션 */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-indigo-50 via-white to-pink-50 rounded-xl">
        <div className="container px-4 md:px-6 mx-auto flex flex-col items-center text-center gap-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            <span className="text-indigo-600">골라</span>
            <span className="text-pink-500">골라</span>
            <span className="block text-2xl md:text-3xl mt-2 font-bold text-gray-700">
              서프라이즈 선물 교환 서비스
            </span>
          </h1>

          <p className="max-w-[700px] text-lg md:text-xl text-gray-600">
            친구들과 함께하는 특별한 선물 교환 경험을 만들어보세요. 누가 어떤
            선물을 준비했는지 비밀로 하고, 서로의 마음이 담긴 선물을
            주고받아보세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/auth/register" passHref>
              <Button size="lg" className="font-medium">
                초대코드로 시작하기
              </Button>
            </Link>
            <Link href="/events" passHref>
              <Button size="lg" variant="outline" className="font-medium">
                이벤트 둘러보기
              </Button>
            </Link>
          </div>

          <div className="relative w-full max-w-3xl h-64 md:h-96 mt-6">
            <Image
              src="/gift-exchange-illustration.svg"
              alt="선물 교환 일러스트레이션"
              fill
              className="object-contain"
              style={{
                objectFit: "contain",
                // 이미지가 없는 경우를 위한 배경색
                backgroundColor: "transparent",
              }}
            />
          </div>
        </div>
      </section>

      {/* 주요 기능 소개 */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            골라골라의 특별한 기능
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                초대 기반 참여
              </h3>
              <p className="text-gray-600">
                이미 참여 중인 친구의 초대 코드를 통해서만 가입할 수 있어 친밀한
                커뮤니티를 유지합니다.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-pink-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                익명 선물 교환
              </h3>
              <p className="text-gray-600">
                선물 등록자는 익명으로 처리되어 더 많은 즐거움과 설렘을 느낄 수
                있습니다.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                다양한 이벤트
              </h3>
              <p className="text-gray-600">
                생일, 기념일, 시즌 이벤트 등 다양한 테마의 선물 교환을 쉽게
                진행할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 사용 방법 소개 */}
      <section className="w-full py-12 md:py-24 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            이렇게 시작하세요
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "초대코드 입력",
                description: "친구에게 받은 초대 코드로 서비스에 가입하세요.",
              },
              {
                step: "02",
                title: "이벤트 참여",
                description: "원하는 이벤트에 참여하고 선물을 등록하세요.",
              },
              {
                step: "03",
                title: "선물 선택",
                description: "다른 참여자가 등록한 선물 중 하나를 골라보세요.",
              },
              {
                step: "04",
                title: "선물 교환",
                description:
                  "이벤트가 끝나면 선물을 교환하고 즐거움을 나누세요.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 시작하기 CTA */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요!</h2>
            <p className="max-w-2xl mx-auto text-lg mb-8 text-indigo-100">
              친구들과 특별한 선물 교환 경험을 만들어보세요. 간단한 초대 코드만
              있으면 누구나 쉽게 시작할 수 있습니다.
            </p>
            <Link href="/auth/register" passHref>
              <Button
                size="lg"
                className="bg-white text-indigo-700 hover:bg-indigo-50"
              >
                초대코드로 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
