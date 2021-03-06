import { Colors } from "styles";
import React, { useEffect, useState } from "react";
import { View, Modal} from "react-native";  
import Style from "./Style";  
import {Account, Bank} from 'thenewboston' 
import { BlurView, VibrancyView } from "@react-native-community/blur";
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch} from 'react-redux';
import RNConfigReader from 'rn-config-reader';

import { ProtocolAction, IpAddressAction, PortAction, NickNameAction } from 'actions/loginActions' 
import InfoModalWidget from "components/InfoModalWidgets/InfoModalview";
 
const QRCodeScreen = ({ navigation }) => {  
  const [camera, setCamera] = useState(null);   
  const dispatch = useDispatch();  
  const [dlgVisible, setDlgVisible] = useState(false)
  const [dlgMessage, setDlgMessage] = useState("") 
  const onSuccess = (e) => {
     console.log(e.data)
  };

  async function tryConnect(barcodes) {
    if(barcodes != null && barcodes.length > 0 && barcodes[0].url != null){
      try{   
        let bank_url = barcodes[0].protocol + '://' + barcodes[0].ipAddress + ':' + barcodes[0].port;
        const bank = new Bank(bank_url);  
        const accounts = await bank.getAccounts();  
        let validator_rul = barcodes[0].protocol + RNConfigReader.VALIDATOR_SERVER_IP   
        const validator_bank = new Bank(validator_rul);  
        const Aaccount = await validator_bank.getAccounts({ limit: 1, offset: 0 }); 
        var validator_accounts = [];
        let account_size = Aaccount.count; 
        for(let i = 0; i < account_size; i+=100){
          const part_accounts = await validator_bank.getAccounts({ limit: 100, offset: i });  
          validator_accounts = [...validator_accounts, ...part_accounts.results]; 
        }  
  
        dispatch(ProtocolAction(barcodes[0].protocol));
        dispatch(IpAddressAction(barcodes[0].ipAddress))
        dispatch(NickNameAction(barcodes[0].nickName))
        dispatch(PortAction(barcodes[0].port)) 
        navigation('login', {
          nickname: barcodes[0].nickName,
          accounts: accounts,
          validator_accounts: validator_accounts,
          bank_url: bank_url, 
        });  
      } catch(err){ 
        setDlgMessage(err);
        setDlgVisible(true)
        console.log(err)
      }
    }
  }
   
  return ( 
    <View style={Style.container}>  
       <Modal
        animationType="slide"
        transparent={true}
        visible={dlgVisible}  
        onRequestClose={() => {}}
        
      >
         <BlurView
          style={Style.absolute}
          blurType="dark"
          blurAmount={5}
          reducedTransparencyFallbackColor="white"
        />
             
         <LinearGradient start={{x: 0, y: 1}} end={{x: 0, y: 0}} colors={['rgba(29, 39, 49, 0.9)', 'rgba(53, 96, 104, 0.9)']} style={Style.doInofContainer}>
            <InfoModalWidget 
                    title={""}
                    message={dlgMessage} 
                    button={"Ok"} 
                    handleOk={() => {
                    setDlgVisible(false);
                }} />
        </LinearGradient> 
         
      </Modal>
    </View>
    );
};

export default QRCodeScreen;
