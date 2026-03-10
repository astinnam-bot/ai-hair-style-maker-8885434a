import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /> 돌아가기
        </button>

        <h1 className="text-2xl font-bold mb-8">서비스 이용약관</h1>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제1조 (목적)</h2>
            <p>이 약관은 "운세역전" 서비스(이하 "서비스")의 이용과 관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 해요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제2조 (서비스의 정의)</h2>
            <p>① "서비스"란 성명학과 수비학을 기반으로 한 운세 리포트를 제공하는 엔터테인먼트 서비스를 의미해요.</p>
            <p>② "리포트"란 이용자가 입력한 이름과 생년월일을 바탕으로 생성되는 디지털 콘텐츠를 의미해요.</p>
            <p>③ "이용자"란 본 약관에 동의하고 서비스를 이용하는 만 19세 이상의 개인을 의미해요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제3조 (서비스 내용 및 제한)</h2>
            <p>① 본 서비스는 오락 및 참고 목적으로만 제공돼요.</p>
            <p>② 리포트 내용은 전문적인 의학적, 법률적, 재정적 조언을 대체하지 않아요.</p>
            <p>③ 중요한 결정을 내리기 전에는 반드시 해당 분야의 전문가와 상담하세요.</p>
            <p>④ 본 서비스는 만 19세 이상 이용자만 이용할 수 있어요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제4조 (결제)</h2>
            <p>① 리포트 이용권은 1회 결제당 1회 사용할 수 있는 소모성 디지털 상품이에요.</p>
            <p>② 결제 금액 및 결제 방법은 서비스 내 안내를 따라요.</p>
            <p>③ 결제 완료 후 리포트가 즉시 생성되며, 이용자는 결과를 바로 확인할 수 있어요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제5조 (환불 정책)</h2>
            <p className="font-medium text-foreground mt-2">1. 환불이 가능한 경우</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>결제 완료 후 시스템 오류로 리포트가 정상적으로 생성되지 않은 경우</li>
              <li>동일한 결제가 중복으로 처리된 경우</li>
            </ul>
            <p className="font-medium text-foreground mt-3">2. 환불이 어려운 경우</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>리포트 내용을 이미 확인한 경우 (디지털 콘텐츠 특성상)</li>
              <li>단순 변심에 의한 환불 요청</li>
              <li>이용자의 입력 오류로 인한 결과 불만족</li>
            </ul>
            <p className="font-medium text-foreground mt-3">3. 환불 절차</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>환불 요청은 결제일로부터 7일 이내에 해주세요.</li>
              <li>앱 내 고객센터를 통해 환불 사유와 함께 문의해주세요.</li>
              <li>확인 후 3~5영업일 이내에 처리돼요.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제6조 (이용자의 의무)</h2>
            <p>① 이용자는 정확한 정보를 입력해야 해요.</p>
            <p>② 이용자는 타인의 정보를 무단으로 사용하여 서비스를 이용할 수 없어요.</p>
            <p>③ 이용자는 서비스를 통해 얻은 정보를 상업적 목적으로 무단 복제, 배포할 수 없어요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제7조 (면책조항)</h2>
            <p>① 서비스 제공자는 리포트 내용의 정확성이나 신뢰성에 대해 보증하지 않아요.</p>
            <p>② 이용자가 리포트 내용을 근거로 내린 결정에 대해 서비스 제공자는 책임지지 않아요.</p>
            <p>③ 천재지변, 시스템 장애 등 불가항력적인 사유로 인한 서비스 중단에 대해 책임지지 않아요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제8조 (개인정보 보호)</h2>
            <p>① 수집하는 정보: 이름(한글/한자), 생년월일</p>
            <p>② 수집 목적: 운세 리포트 생성 및 서비스 제공</p>
            <p>③ 보관 기간: 리포트 생성 후 30일간 보관 후 자동 삭제</p>
            <p>④ 수집된 개인정보는 제3자에게 제공하지 않아요.</p>
            <p>⑤ 이용자는 언제든지 고객센터를 통해 개인정보 삭제를 요청할 수 있어요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제9조 (저작권)</h2>
            <p>① 서비스 및 리포트에 대한 저작권은 서비스 제공자에게 있어요.</p>
            <p>② 이용자는 개인적인 용도로만 리포트를 이용할 수 있어요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제10조 (약관의 변경)</h2>
            <p>① 본 약관은 관련 법령에 위배되지 않는 범위 내에서 변경될 수 있어요.</p>
            <p>② 약관이 변경되는 경우 서비스 내 공지를 통해 안내해요.</p>
            <p>③ 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있어요.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">제11조 (분쟁해결)</h2>
            <p>① 서비스 이용과 관련한 분쟁은 상호 협의를 통해 해결해요.</p>
            <p>② 협의가 이루어지지 않는 경우 관할 법원은 서비스 제공자 소재지 법원으로 해요.</p>
          </section>

          <p className="pt-4 text-xs text-muted-foreground/70">본 약관은 2026년 2월 4일부터 시행돼요.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
