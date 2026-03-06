import { useNavigate } from 'react-router-dom';
import { genderOptions } from '@/data/hairStyles';
import { Scissors } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Scissors className="w-6 h-6 text-primary" />
          <span className="text-sm font-semibold text-primary">HAIR MODEL AI</span>
        </div>
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          AI 헤어 모델로<br />
          스타일을 미리 확인하세요
        </h1>
        <p className="text-muted-foreground text-[15px] mt-2">
          성별을 선택하고 원하는 스타일을 골라보세요
        </p>
      </header>

      {/* Gender Selection */}
      <main className="flex-1 px-5 pb-10">
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => navigate(`/category/${option.id}`)}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary hover:bg-secondary transition-all duration-200 active:scale-[0.97] text-left group animate-fade-in"
            >
              <span className="text-5xl block mb-4">{option.emoji}</span>
              <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {option.label}
              </span>
              <span className="text-sm text-muted-foreground block mt-1">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-secondary rounded-2xl p-5">
          <p className="text-sm font-semibold text-foreground mb-1">✨ AI가 생성하는 헤어 모델</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            원하는 헤어스타일을 선택하면 AI가 해당 스타일의 헤어 모델 이미지를 생성합니다.
            미리보기 1장은 무료, 상세 4컷은 결제 후 확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
