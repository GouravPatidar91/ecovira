
import Navigation from "@/components/Navigation";
import AuthForm from "@/components/AuthForm";

const Auth = () => {
  return (
    <div className="page-container">
      <Navigation />
      <div className="container-layout section-padding">
        <div className="max-w-md mx-auto">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;
