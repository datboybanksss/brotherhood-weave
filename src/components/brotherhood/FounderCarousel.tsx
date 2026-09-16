import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";

interface Founder {
  id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;

}

export default function FounderCarousel({ founders }: { founders: Founder[] }) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (founders.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % founders.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [founders.length]);

  if (!founders.length) return null;

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {founders.map(founder => (
            <div key={founder.id} className="w-full shrink-0 flex justify-center px-4">
              <ProfileCard
                userId={founder.id}
                name={founder.full_name}
                title="Co-founder"
                contactText="View Profile"
                onContactClick={() => navigate(`/member/${founder.id}`)}
              />
            </div>
          ))}
        </div>
      </div>
      {founders.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {founders.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === current ? 'bg-brand-royal' : 'bg-stroke-hairline'
              }`}
              aria-label={`View founder ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
