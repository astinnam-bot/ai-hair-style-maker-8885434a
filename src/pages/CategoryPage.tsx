import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { categoryOptions, type Gender } from '@/data/hairStyles';
import TicketBanner from '@/components/TicketBanner';


const CategoryPage = () => {
  const navigate = useNavigate();
  const { gender } = useParams<{ gender: string }>();
  const [searchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const genderLabel = gender === 'male' ? '남성' : '여성';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-8 pb-6">
        <h1 className="text-[26px] font-bold text-foreground">
          {genderLabel} 스타일
        </h1>
        <p className="text-muted-foreground text-[15px] mt-1">
          원하는 스타일 카테고리를 선택해 주세요
        </p>
      </header>

      {/* Categories */}
      <main className="flex-1 px-5 pb-10">
        <div className="mb-5">
          <TicketBanner />
        </div>
        <div className="flex flex-col gap-3">
          {categoryOptions.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/styles/${gender}/${cat.id}${queryString ? `?${queryString}` : ''}`)}
              className="bg-card rounded-2xl p-5 border border-border hover:border-primary hover:bg-secondary transition-all duration-200 active:scale-[0.98] text-left group animate-fade-in flex items-center gap-4"
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
            >
              <span className="text-4xl">{cat.emoji}</span>
              <div>
                <span className="text-[17px] font-bold text-foreground group-hover:text-primary transition-colors block">
                  {cat.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {cat.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CategoryPage;
