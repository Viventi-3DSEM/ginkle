import { IonButton,
   IonContent, 
   IonHeader, 
   IonPage, 
   IonTitle, 
   IonToolbar, 
   IonButtons, 
   IonText, 
   IonGrid,
   IonRow,
   IonCol,
   IonSearchbar,

  } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ginkle</IonTitle>
          <IonButtons slot="end">
          <IonButton>Login</IonButton>
          <IonButton>Cadastre-se</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>


      <IonContent fullscreen>
        <IonGrid className='principal'>
          <IonRow>
          
          <IonCol size="12" size-md="6">

        <IonText className="titulo"><h1>Ginkle</h1></IonText>
        <IonText className="subtitulo"><p>Encontre as melhores casas de repouso
           e cuidadores qualificados com a segurança, transparência e dedicação que sua família merece.</p></IonText>
        <IonButton className='btn-saibamais'>Saiba Mais</IonButton>

          </IonCol>

          <IonCol size="12" size-md="6">
            <img className="image"loading='lazy' src="..\src\assets\closeup-support-hands.jpg"></img>
          </IonCol>

          </IonRow>
        </IonGrid>

        <IonSearchbar placeholder='Busque casas de repouso' className='search'></IonSearchbar>

      <IonGrid className='grade'>
        <IonRow>

      <IonCol>
      
      </IonCol>
      
      <IonCol>

      </IonCol>
      

        </IonRow>
      </IonGrid>

      </IonContent>
    </IonPage>
  );
};

export default Home;
