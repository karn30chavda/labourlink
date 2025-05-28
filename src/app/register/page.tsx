import { RegisterForm } from "@/components/forms/RegisterForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl w-full">
        <div className="hidden md:flex justify-center order-last md:order-first">
           <Image 
            src="https://placehold.co/400x550.png" 
            alt="Registration illustration" 
            width={400} 
            height={550} 
            className="rounded-lg shadow-xl object-cover"
            data-ai-hint="construction team planning"
          />
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
