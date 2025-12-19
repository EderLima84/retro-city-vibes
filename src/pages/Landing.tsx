import { Button } from "@/components/ui/button";
import { Home, Users, BookOpen, Film, Shield, Building2, User, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeSelector } from "@/components/ThemeSelector";
import OrkadiaLogo from "@/assets/Orkadia-logo.png";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: User,
      title: "Perfil",
      description: "Seu perfil é sua casa virtual. Personalize e receba visitantes!"
    },
    {
      icon: Users,
      title: "Clubes", 
      description: "Junte-se a comunidades com seus interesses e hobbies."
    },
    {
      icon: Heart,
      title: "Amigos",
      description: "Conecte-se com pessoas de verdade e construa amizades duradouras."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle magical particles */}
      <div className="absolute top-20 left-20 w-1 h-1 bg-white/40 rounded-full animate-particle-float" style={{animationDelay: '0s'}}></div>
      <div className="absolute top-32 right-32 w-1 h-1 bg-white/30 rounded-full animate-particle-float" style={{animationDelay: '3s'}}></div>
      <div className="absolute bottom-32 right-20 w-1 h-1 bg-white/35 rounded-full animate-particle-float" style={{animationDelay: '6s'}}></div>
      <div className="absolute bottom-48 left-2/3 w-1 h-1 bg-white/25 rounded-full animate-particle-float" style={{animationDelay: '9s'}}></div>
      
      {/* Theme Selector - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSelector />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-12">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="inline-block">
            <img src={OrkadiaLogo} alt="Orkadia Logo" className="mx-auto mb-6 w-72 h-auto drop-shadow-lg" />
          </div>
          
          {/* Text with dark background for better contrast */}
          <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 mx-auto max-w-4xl border border-white/20">
            <h1 className="text-2xl md:text-3xl font-bold text-white max-w-2xl mx-auto leading-relaxed mb-4">
              Onde as conexões voltam a ser humanas
            </h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Uma rede social inspirada no clássico Orkut. 
              Construa sua casa virtual, participe de clubes e conecte-se com pessoas de verdade!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-10 py-3 rounded-full font-semibold"
              onClick={() => navigate('/auth')}
            >
              Entrar na Cidade
            </Button>
            <Button 
              size="lg"
              className="bg-white/20 backdrop-blur-md border-2 border-white/50 text-white hover:bg-white hover:text-gray-800 text-lg px-10 py-3 rounded-full transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 mx-auto max-w-md mb-16 border border-white/20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white">
            Explore a Cidade
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 animate-slide-up border border-white/60 hover:bg-white/95"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-lg">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-pink-600/50"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para começar sua jornada?
            </h2>
            <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed">
              Junte-se a milhares de pessoas que já fazem parte da Orkadia
            </p>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-50 text-xl px-12 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Criar Minha Casa Virtual
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation Icons */}
      <div className="relative z-10 container mx-auto px-4 pb-8">
        <div className="flex justify-center space-x-6">
          <div className="p-4 bg-black/50 rounded-full backdrop-blur-md border border-white/30 hover:bg-black/60 transition-all duration-300">
            <Home className="w-6 h-6 text-blue-200" />
          </div>
          <div className="p-4 bg-black/50 rounded-full backdrop-blur-md border border-white/30 hover:bg-black/60 transition-all duration-300">
            <Film className="w-6 h-6 text-purple-200" />
          </div>
          <div className="p-4 bg-black/50 rounded-full backdrop-blur-md border border-white/30 hover:bg-black/60 transition-all duration-300">
            <Shield className="w-6 h-6 text-pink-200" />
          </div>
          <div className="p-4 bg-black/50 rounded-full backdrop-blur-md border border-white/30 hover:bg-black/60 transition-all duration-300">
            <Building2 className="w-6 h-6 text-cyan-200" />
          </div>
          <div className="p-4 bg-black/50 rounded-full backdrop-blur-md border border-white/30 hover:bg-black/60 transition-all duration-300">
            <BookOpen className="w-6 h-6 text-indigo-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
