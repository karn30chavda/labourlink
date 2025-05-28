import { LoginForm } from "@/components/forms/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl w-full">
        <div className="hidden md:flex justify-center">
           <Image 
            src="https://placehold.co/400x500.png" 
            alt="Login illustration" 
            width={400} 
            height={500} 
            className="rounded-lg shadow-xl object-cover"
            data-ai-hint="construction login handshake"
          />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
