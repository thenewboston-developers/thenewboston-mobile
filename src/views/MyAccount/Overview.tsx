import { Colors, Custom, Typography } from "styles";
import React, { useEffect, useState,} from "react"; 
import nacl from 'tweetnacl'
import naclutil from 'tweetnacl-util' 
import { BlurView, VibrancyView } from "@react-native-community/blur";
import { useSelector, useDispatch} from 'react-redux';
import { IAppState } from 'store/store'; 
import LinearGradient from 'react-native-linear-gradient'; 
import EncryptedStorage from 'react-native-encrypted-storage';  
import { 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  ActivityIndicator, 
  NativeModules
} from "react-native";
import Style from "./Style"; 
import GestureRecognizer from 'react-native-swipe-gestures';

import Accounts from "components/Accounts/Accounts";
import CustomButton from "components/CustomButton";
import AccountNumber from "components/AccountNumber/AccountNumber";
import SignKey from "components/SignKey/SignKey"; 
import CreateAccountWidget from "components/CreateAccountWIdget/CreateAccountWidget";
import DoneModalViewWidget from "components/CustomWidgets/DoneModalview";
import InfoModalWidget from "components/InfoModalWidgets/InfoModalview";   
import { AccountAction } from 'actions/accountActions'
import DeleteAccount from './DeleteAccount/DeleteAccount' 
import Refresh from "assets/svg/Refresh.svg";  
import DoneSvg from "assets/svg/PullDown.svg"

const OverviewScreen = ({ route, navigation }) => {
 
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch(); 
  const lAccounts = useSelector((state: IAppState) => state.accountState.account); 
  const {validator_accounts, bank_url, login} = route.params;  
  const [myAccounts, setMyAccounts] = useState(lAccounts == null ? [] : lAccounts); 
  const [modalVisible, setModalVisible] = useState(false);   
  const [viewRef, setViewRef] = useState(null);  
  const [actName, setActName] = useState((myAccounts == null || myAccounts.length == 0) ? 'No Accounts' : myAccounts[0].name); 
  const [actNumber, setActNumber] = useState((myAccounts == null || myAccounts.length == 0) ? '' : (myAccounts[0].account_number)); 
  const [actSignKey, setActSignKey] = useState((myAccounts == null || myAccounts.length == 0) ? '' : toDecryptSignKey(myAccounts[0]));  
  const [actBalance, setActBalance] = useState((myAccounts == null || myAccounts.length == 0) ? '0.00' : myAccounts[0].balance); 
  const [doneVisible, setDoneVisible] = useState(login != 'login'); 
  const [addMode, setAddMode] = useState(false); 
  const [dlgMessage, setDlgMessage] = useState("");
  const [dlgVisible, setDlgVisible] = useState(false); 
  const [removeVisible, setRemoveVisible] = useState(false);
  const [spinVisible, setSpinVisible] = useState(false) 
  const [privateKey, setPrivateKey] = useState(null);  
  const [publicKey, setPublicKey] = useState(null); 
    
  type AccountKeys = [Uint8Array, Uint8Array];
  const handleSendCoins = () => { 
     
  };

  function naclEncrypting(plain_text){
    const one_time_code = nacl.randomBytes(24);    
    const cipher_text = nacl.box(
      naclutil.decodeUTF8(plain_text),
        one_time_code,
        hexToUint8Array(publicKey),
        hexToUint8Array(privateKey)
        
    );  
    const message_in_transit = {cipher_text, one_time_code}; 
    return message_in_transit;
  };

  function toDecryptSignKey(account){   
    if(account.isEncrypt == false || account.one_time_code == null){ 
      return account.sign_key
    }
    else{ 
      const message = {cipher_text: account.sign_key, one_time_code: account.one_time_code}
      return naclDecrypting(message)
    } 
  }

  function naclDecrypting(message){ 
     
    let decoded_message = nacl.box.open(message.cipher_text, message.one_time_code, hexToUint8Array(publicKey), hexToUint8Array(privateKey));   
    let plain_text = naclutil.encodeUTF8(decoded_message)  
    return plain_text;
  };

  function toHexString(byteArray) {
    return Array.prototype.map.call(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  }

  const [seed, setSeed] = useState(""); 

  useEffect(() => {  
    getSeedESP();
  }, []);  

  function generateFromKey(signingKey: string): AccountKeys { 
    const { publicKey: accountNumber, secretKey: signingKey_ } = nacl.sign.keyPair.fromSeed(hexToUint8Array(signingKey));
    return [accountNumber, signingKey_];
  }
  
  function fromBothKeys(signingKey: string, accountNumber: string): AccountKeys {
    const accountNumberArray = hexToUint8Array(accountNumber);
    const signingKeyArray = new Uint8Array(64);
    signingKeyArray.set(hexToUint8Array(signingKey));
    signingKeyArray.set(accountNumberArray, 32);
    return [accountNumberArray, signingKeyArray];
  }
    
  function hexToUint8Array(arr: string): Uint8Array {
    return new Uint8Array(Buffer.from(arr, "hex"));
  } 

  async function getSeedESP() {
    try {   
      const session = await EncryptedStorage.getItem("seed");    
      if (session !== undefined) {
           setSeed(session);   
      }
      const keyPair = await EncryptedStorage.getItem("keyPair");     
      if (keyPair !== undefined) {  
        setPrivateKey(JSON.parse(keyPair).privateKey);   
        setPublicKey(JSON.parse(keyPair).publicKey);     
      }
    } catch (error) {
       console.log(error);
    }
  } 

  const deleteAccount = () => {   
    let _myAccounts = myAccounts.filter(item => item.account_number !== actNumber);
    setMyAccounts(_myAccounts);  
    dispatch(AccountAction(_myAccounts)); 
    
    if(_myAccounts != [] && _myAccounts.length > 0){
      setActName(_myAccounts[0].name);
      setActNumber((_myAccounts[0].account_number));
      setActSignKey( toDecryptSignKey(_myAccounts[0]));
      setActBalance(_myAccounts[0].balance);
    }
    else{
      setActName('No Accounts');
      setActNumber('');
      setActSignKey('');
      setActBalance('0.00');
    }
  }; 

  const onRefresh = () => {
    if(validator_accounts != null){ 
      setSpinVisible(true);
      let cusAccounts = myAccounts.map((account)=>{
        validator_accounts.forEach(item => {
          if(item.account_number == account.account_number){
            account.balance = item.balance; 
            return false;
          }
        }); 
        return account 
      })  
     dispatch(AccountAction(cusAccounts));  
     setMyAccounts(cusAccounts);
     setSpinVisible(false);

   }  
  }

  const handleTransIndex = (index) => { 
     
    if(myAccounts.length > 0){
      if(myAccounts[index].name == null){
        setActName(index);
      } 
      else{
        setActName(myAccounts[index].name);
      } 
      setActNumber((myAccounts[index].account_number));   
      setActSignKey(toDecryptSignKey(myAccounts[index]));
      setActBalance(myAccounts[index].balance);  
    } 
  }

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 50
  };

  const onSwipeLeft = (state) =>{
      navigation.navigate('transactions')
  }

  const onSwipeDown = (state) =>{
    setModalVisible(false);
  }

  return (
    <View style={Style.container}  ref={(viewRef) => { setViewRef(viewRef); }}> 
      <GestureRecognizer  
            onSwipeLeft={(state) => onSwipeLeft(state)} 
            onSwipeDown={(state) => onSwipeDown(state)} 
            config={config} 
            style={Style.container}
        >
      <View style={{ alignItems: "center"}} >
        <Text style={Style.heading}>{actName}</Text> 
        <Accounts
          accounts={myAccounts}
          addAccount={() => setModalVisible(true)}
          handleTransIndex = {(index) => handleTransIndex(index)}
        />

      </View> 
      {spinVisible && <ActivityIndicator size="large" color="white" style={{justifyContent:'center', marginTop:'32%'}}></ActivityIndicator>}
      {!spinVisible && <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[Custom.row, Custom.mt30]}>
          <View>
            <Text style={[Style.subHeading]}>MY ACCOUNT BALANCE</Text>
            <Text style={[Style.heading]}>{actBalance}</Text>
          </View>
          <TouchableOpacity
            style={Style.refreshbutton}
            onPress={onRefresh}
          >
            <Refresh />
          </TouchableOpacity>
        </View>
 
        <CustomButton
          title="Send Coins" 
          onPress={()=>navigation.navigate('sendcoins1')}
          buttonColor={Colors.WHITE}
          loading={loading}
          customStyle={{ width: "35%" }}
        />

        <AccountNumber
          navigator={navigation}
          accountNumber={
            actNumber
          }
        />
        <SignKey
          signKey={ actSignKey }
          writeKeyFunc = {(msg)=>{
            setDlgMessage(msg);
            setDlgVisible(true);
          }}
        /> 
        <CustomButton
          title="Delete Account"
          onPress={()=>{
            if(myAccounts.length > 0){
              setRemoveVisible(true);  
            }
          }}
          buttonColor={Colors.WHITE}
          loading={loading}
          customStyle={Style.deleteButton}
        />
        <CustomButton
          title=""
          onPress={handleSendCoins}
          buttonColor={Colors.WHITE}
          loading={loading}
          customStyle={Style.bottomArea}
        />
      </ScrollView>}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
           
        }}
      >
        <BlurView
          style={Style.absolute}
          blurType="dark"
          blurAmount={5}
          reducedTransparencyFallbackColor="white"
        />
        <View style={Style.modalContainer}>
          <View style= {Style.pulldonwContainer}>
            <DoneSvg width="15%" height="5%" />
          </View>
        
          <ScrollView showsVerticalScrollIndicator={false}>
          <CreateAccountWidget title={"Create or Add Account"}
            navigation={navigation}
            route = {route} 
            addAccount={(account, addMode) => { 
              setActName(account.name);
              setActNumber(account.account_number);
              setActBalance(account.balance);
              setAddMode(addMode);
              var bExist = false;  
              var bExistName = false;
              myAccounts.map((item)=>{
                if(item.account_number == account.account_number){
                  bExist = true;
                }
                if(item.name == account.name){
                  bExistName = true;
                }
              })
              if(bExist != false){ 
                setDlgMessage("This signing key exists in your accounts");
                setDlgVisible(true);
              }
              else if(bExistName != false){ 
                setDlgMessage("This account name exists in your accounts");
                setDlgVisible(true);
              }
              else{   
                if(publicKey != null && privateKey != null){
                  const encryptedData = naclEncrypting(account.sign_key) 
                  account.sign_key = encryptedData.cipher_text;
                  account.one_time_code = encryptedData.one_time_code;
                  account.isEncrypt = true; 
                  myAccounts.push(account); 
                  dispatch(AccountAction(myAccounts));
                  setMyAccounts(myAccounts); 
                  setModalVisible(false);
                  setDoneVisible(true); 
                }
               
              }
              
            }} 
            validator_accounts = {validator_accounts}
            handleCancel={() => {
              setModalVisible(false);
            }}
            />
            </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={doneVisible}  
        onRequestClose={() => {
           
        }}
        
      >
         <BlurView
          style={Style.absolute}
          blurType="dark"
          blurAmount={5}
          reducedTransparencyFallbackColor="white"
        />
             
         <LinearGradient start={{x: 0, y: 1}} end={{x: 0, y: 0}} colors={['rgba(29, 39, 49, 0.9)', 'rgba(53, 96, 104, 0.9)']} style={Style.doModalContainer}>
            <DoneModalViewWidget 
                    title={"Done"}
                    message={addMode ? "Your account has been successfully added!" : "Your account has been successfully created!"}
                    navigation={navigation}
                    button={"Ok"} 
                    handleOk={() => {
                    setDoneVisible(false);
                }} />
        </LinearGradient>  
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={dlgVisible}  
        onRequestClose={() => {
           
        }}
        
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
      <Modal
          animationType="fade"
          transparent={true}
          visible={removeVisible}  
          onRequestClose={() => {
          
          }}
          
      >
          <BlurView
          style={Style.absolute}
          blurType="dark"
          blurAmount={5}
          reducedTransparencyFallbackColor="white"
          /> 

          <LinearGradient start={{x: 0, y: 1}} end={{x: 0, y: 0}} colors={['rgba(29, 39, 49, 0.9)', 'rgba(53, 96, 104, 0.6)']} style={Style.deleteContainer}>
              <DeleteAccount 
                  title={"Delete account"}
                  message={"Are you sure you want to delete this account?"} 
                  balance={actBalance}
                  nickname={actName}
                  account_number={actNumber}
                  yes={"Ok"} 
                  no={"Cancel"} 
                  handleYes={() => {  
                      deleteAccount();
                      setRemoveVisible(false);
                  }}
                  handleNo={() => {
                    setRemoveVisible(false);
                  }}
              /> 
          </LinearGradient>  
      </Modal>
      </GestureRecognizer>
    </View>
  );
};

export default OverviewScreen;
