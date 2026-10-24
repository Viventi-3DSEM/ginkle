import Link from "next/link";

export default function Footer(){
    return(
        
        <footer className="px-6 bg-[#263b49] py-9">
            <section className="grid grid-cols-1 gap-8 px-8 text-sm sm:grid-cols-3 md:px-16 ml-20">
                <div className="flex flex-col gap-3">
                <a>ginkle@ginkle.com</a>
                <a>(13) 9912-3456</a>
                </div>
                <div className="flex flex-col gap-1">
                <a>Termos de Uso</a>
                <a>Avisos Legais</a>
                </div>
                <div className="flex flex-col gap-1">
                <a>Preferências de Cookies</a>
                <a>&copy; {new Date().getFullYear()} Ginkle</a>
                </div>
                
                

            </section>
        </footer>

    )
}