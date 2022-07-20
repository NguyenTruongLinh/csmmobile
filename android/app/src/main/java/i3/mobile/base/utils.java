package i3.mobile.base;

import android.util.Log;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.security.spec.AlgorithmParameterSpec;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import i3.mobile.base.Constant;

/**
 * Created by Administrator on 11/28/2017.
 */

public class utils {

    public utils()
    {
        super();
    }

    public int ByteArrayToInt(byte[] _buff, int _offset)
    {
        int value = 0;
        for(int i = 0; i < 4; i++)
        {
            int shift = (3 - i) * 8;
            value += (_buff[i +_offset] & 0x000000FF) << shift;
        }
        return value;
    }

    public static char ByteArrayToChar(byte[] _buff, int _offset)
    {
        char value = 0;
        for(int i = 0; i < 2; i++)
        {
            int shift = (1 - i) * 8;
            value += (_buff[i +_offset] & 0x00FF) << shift;
        }
        return value;
    }
    public static char ByteArrayCToChar(byte[] _buff, int _offset)
    {
        byte[] bb = {_buff[_offset+ 1], _buff[_offset]};
        return  ByteArrayToChar( bb, 0);

    }

    public static int ByteArrayOfCToIntJava(byte[] _buff, int _offset)
    {
        int value = 0;
        for (int i = 0; i < 4; i++)
        {
            int shift = (3 - i) * 8;
            value += (_buff[3 - i + _offset] & 0x000000FF) << shift;
        }
        return value;
    }
    public char ReadChar(DataInputStream _is) throws Exception
    {
        byte[] buff = ReadBlock(_is, 2);
        byte[] b ={buff[1], buff[0]};
        return ByteArrayToChar(b, 0);
    }


    public int ReadShortInt(DataInputStream _is) throws Exception
    {
        byte[] buff = ReadBlock(_is, 2);
        return ByteArrayOfCToCharJava(buff, 0);
    }

    public void SendInt(DataOutputStream _os, int _value) throws IOException
    {
        byte[] buff = IntToByteArrayOfC(_value);
        _os.write(buff);
        _os.flush();
    }

    public long ReadLong(DataInputStream _is) throws Exception
    {
        byte[] buff = ReadBlock(_is,  8);
        return ByteArrayOfCToLongJava(buff, 0);
    }

    public byte[] ReadBlock(DataInputStream _is, int _length)
            throws IOException // read length bytes from is
    {
        byte[] result = null;
        try {
            result = new byte[_length]; //try - catch : array size too large
            int count = 0;
            while (count < _length) {

                int i = _is.read(result, count, _length - count);
                if (i != -1) {
                    count += i;
                } else {

                    throw new EOFException();
                }
            }
        } catch (IOException e) {

            throw e;
        }
        return result;

    }
    public int ReadInt(DataInputStream _is) throws Exception
    {
        byte[] buff = ReadBlock(_is, 4);
        return ByteArrayOfCToIntJava(buff, 0);
    }

    public  static Element ParserXML( String xml){
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            InputSource is = new InputSource(new StringReader(xml));
            Document document = builder.parse(is);
            Element rootElement = document.getDocumentElement();
            return rootElement;
        }
        catch (Exception ex)
        {
            return  null;
        }
    }
    public Element ParserXML(InputStream is, boolean isEncrypted) throws Exception
    {
        if(isEncrypted)
        {
            byte[] isStr = new byte[1024*150];
            int isLength = 0;

            while(true)
            {
                int bytesRead = is.read( isStr, isLength, 100 );
                if( bytesRead <= 0 )
                    break;

                isLength += bytesRead;
            }

            int lengthOfXml = ByteArrayToInt(isStr, 0);
            int encryptedStrLength = isLength - 4;

            byte[] encryptedStr = new byte[encryptedStrLength];
            for(int i = 0 ; i < encryptedStrLength; i++)
                encryptedStr[i] = isStr[i + 4];

            byte[] decryptedStr = AES_Decrypt(Constant.aesKey, encryptedStr);

            ByteArrayInputStream bis = new ByteArrayInputStream(decryptedStr, 0, lengthOfXml);

//			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
//		    DocumentBuilder builder = factory.newDocumentBuilder();
//		    Document document = builder.parse(bis);
//		    Element rootElement = document.getDocumentElement();
//		    rootElement.normalize();
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(new InputSource(new InputStreamReader(bis, Constant.XML_SERVER_ENCODEDING)));
            Element rootElement = document.getDocumentElement();
            return rootElement;
        }
        else
        {
//
//			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
//		    DocumentBuilder builder = factory.newDocumentBuilder();
//		    Document document = builder.parse(is);
//		    Element rootElement = document.getDocumentElement();
//		    rootElement.normalize();
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(new InputSource(new InputStreamReader(is,Constant.XML_SERVER_ENCODEDING)));
            Element rootElement = document.getDocumentElement();
            return rootElement;

        }
    }

    public static byte[] AES_Encrypt(byte[] raw, byte[] clear) throws Exception
    {
        byte[] iv = new byte[]{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
        AlgorithmParameterSpec paramSpec = new IvParameterSpec(iv);
        SecretKeySpec skeySpec = new SecretKeySpec(raw, "AES");
        Cipher cipher = Cipher.getInstance("AES/CBC/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, skeySpec, paramSpec);
        byte[] encrypted = cipher.doFinal(clear);
        return encrypted;

    }
    private static byte[]  AES_Decrypt(byte[] raw, byte[] encrypted) throws Exception
    {
        byte[] iv = new byte[]{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
        AlgorithmParameterSpec paramSpec = new IvParameterSpec(iv);

        SecretKeySpec skeySpec = new SecretKeySpec(raw, "AES");
        Cipher cipher = Cipher.getInstance("AES/CBC/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, skeySpec, paramSpec);
        byte[] decrypted = cipher.doFinal(encrypted);
        return decrypted;
    }
    public Element ReceiveXML(DataInputStream _is, boolean _isZip) throws ParserConfigurationException, SAXException, Exception
    {
        int lenBuff = ReadInt(_is);
        if( (lenBuff <= 0) || (lenBuff > 1024*1024))
            throw new SAXException("Very large data Exception");
        byte[] buffer = ReadBlock(_is, lenBuff);
        ByteArrayInputStream xmlIS = new ByteArrayInputStream(buffer);
        if(_isZip)
        {
            ZipInputStream zis = new ZipInputStream(xmlIS);
            ZipEntry ze = zis.getNextEntry();
            int unzipDataLength = (int) ze.getSize();

            byte[] unzipBuffer = new byte[unzipDataLength];
            int count = 0;
            while (count < unzipDataLength)
            {
                int i = zis.read(unzipBuffer, count, unzipDataLength - count);
                count += i;
            }
            zis.close();
            ByteArrayInputStream xmlUnZipIS = new ByteArrayInputStream(unzipBuffer);
            return ParserXML(xmlUnZipIS, false);
        }
        return ParserXML(xmlIS, false);
    }
    public static String ReplaceSpecialCharForXML(String src)
    {
        int lengthSrc = src.length();
        StringBuffer des = new StringBuffer("");
        for(int i = 0; i < lengthSrc; i++)
        {
            char curChar = src.charAt(i);

            if(curChar == '&')
                des.append("&amp;");
            else if(curChar  == '<')
                des.append("&lt;");
            else if(curChar  == '>')
                des.append("&gt;");
            else if(curChar  == '\"')
                des.append("&quot;");
            else if(curChar  == '\'')
                des.append("&#39;");
            else
                des.append(curChar);
        }
        return des.toString();
    }

    public static byte[] IntToByteArray(int _value)
    {
        byte[] result = new byte[4];
        result[0] = (byte) (_value >> 24);
        result[1] = (byte) (_value >> 16);
        result[2] = (byte) (_value >> 8);
        result[3] = (byte) (_value);
        return result;
    }

    public static byte[] IntToByteArrayReversed(int _value)
    {
        byte[] result = new byte[4];
        result[3] = (byte) (_value >> 24);
        result[2] = (byte) (_value >> 16);
        result[1] = (byte) (_value >> 8);
        result[0] = (byte) (_value);
        return result;
    }

    public byte[] CharToByteArray(char _value)
    {
        byte[] result = new byte[2];
        result[0] = (byte) (_value >> 8);
        result[1] = (byte) (_value);
        return result;
    }
    public static byte[] CharToByteArrayOfC(char _value)
    {
        byte[] result = new byte[2];
        result[1] = (byte) (_value >> 8);
        result[0] = (byte) (_value);
        return result;
    }
    public static byte[] IntToByteArrayOfC(int _value)
    {
        byte[] result = new byte[4];
        result[0] = (byte) (_value);
        result[1] = (byte) (_value >> 8);
        result[2] = (byte) (_value >> 16);
        result[3] = (byte) (_value >> 24);
        return result;
    }
    public byte[] LongToByteArrayOfC(long _value)
    {
        byte[] result = new byte[8];
        for(int i = 0 ; i < 8 ; i++)
            result[i] = (byte) (_value >> (8*i));
        return result;
    }


    public char ByteArrayOfCToCharJava(byte[] _buff, int _offset)
    {
        char value = 0;
        for (int i = 0; i < 2; i++)
        {
            int shift = (1 - i) * 8;
            value += (_buff[1 - i + _offset] & 0x000000FF) << shift;
        }
        return value;
    }

    public static long ByteArrayOfCToLongJava(byte[] _buff, int _offset)
    {
        long value = 0;
        for (int i = 0; i < 8; i++)
        {
            int shift = (7 - i) * 8;
            value += (_buff[7 - i + _offset] & 0x000000FF) << shift;
        }
        return value;
    }
    public byte[] ConstructLoginInfoForSend(String _userName, String _pass, String _svrID, int _serverVersion) throws Exception
    {
        String loginXMLstr = "<LoginInfo user_name=\"" + _userName + "\" password=\"" + _pass
                + "\" server_id=\"" + _svrID + "\" remote_type=\"2\"></LoginInfo>";
        byte[] bloginXMLstrTmp = loginXMLstr.getBytes();

        byte[] bLoginXmlSend = bloginXMLstrTmp;

        if(_serverVersion > Constant.EnumServerVersion.VERSION_2200)
        {
            int xmlLength = bloginXMLstrTmp.length;

            int newLength = - 1;
            if( (xmlLength%16) == 0)
                newLength = xmlLength + 16;
            else
                newLength = xmlLength + 32 - (xmlLength%16);

            bLoginXmlSend = new byte[newLength];
            for(int i = 0; i < xmlLength; i++)
                bLoginXmlSend[i] = bloginXMLstrTmp[i];

            for( int i = xmlLength; i < newLength; i++ )
                bLoginXmlSend[i] = 0;

            byte[] realXmlLength = IntToByteArray(xmlLength);
            for(int i = 0; i < 4; i++)
                bLoginXmlSend[newLength - 4 + i] = realXmlLength[i];

            // encrypt
            byte[] encryptedXML = AES_Encrypt(Constant.aesKey ,bLoginXmlSend);
            bLoginXmlSend = encryptedXML;


//			byte[] nm = new byte[1600];
//			for(int i = 0 ; i < 1000; i++)
//				nm[i] = (byte)i;
//
//			byte[] en = AES_Encrypt(Constant.aesKey ,nm);
//
//			byte[] de = AES_Decrypt(Constant.aesKey ,en);
//
//			en = null;

        }

        int loginXmlLength = bLoginXmlSend.length;

        int totalLength = 4/*integer*/ + 2 /*char*/ + 4 /*mobile version*/+ loginXmlLength;
        int realDataSize = totalLength - 4;

        byte[] bSize = IntToByteArrayOfC(realDataSize);
        byte[] bComMsg = CharToByteArrayOfC(Constant.EnumCmdMsg.MOBILE_MSG_LOGIN);
        byte[] bMobileVersion = IntToByteArrayOfC(Constant.EnumMobileVersion.MOBILE_VERSION_CURRENT);

        byte[] loginBuff = new byte[totalLength];
        for(int i = 0 ; i < 4 ; i++)
            loginBuff[i] = bSize[i];

        loginBuff[4] = bComMsg[0];
        loginBuff[5] = bComMsg[1];

        for(int i = 0 ; i < 4 ; i++)
            loginBuff[i+6] = bMobileVersion[i];

        for(int i = 0 ; i < loginXmlLength; i++)
            loginBuff[i+10] = bLoginXmlSend[i];

        return loginBuff;
    }
    public static boolean isValidIp4Address(final String hostName) {
        try {
            return Inet4Address.getByName(hostName) != null;
        } catch (Exception ex) {
            return false;
        }
    }


    public static boolean isValidIp6Address(final String hostName) {
        try {
            return Inet6Address.getByName(hostName) != null;
        } catch (Exception ex) {
            return false;
        }
    }

    public  static String getIpAddress( final  String IporHost) throws UnknownHostException
    {
        try {
            if (!isValidIp4Address(IporHost)) {
                InetAddress unAdd = InetAddress.getByName(IporHost);//.getByName(IporHost);
                String Ip = unAdd.getHostAddress();
            }
            return IporHost;
        }catch (UnknownHostException ex)
        {
            return null;
        }
    }

    public static byte[] documentToByte(Document document) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StreamResult result = new StreamResult(baos);
        Transformer transformer;
        try {
            transformer = TransformerFactory.newInstance().newTransformer();
            transformer.transform(new DOMSource(document), result);

        } catch (TransformerConfigurationException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (TransformerFactoryConfigurationError e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (TransformerException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return baos.toByteArray();
    }
    public static byte readByte(BufferedInputStream in){

        try
        {
            int var1 = in.read();
            return (byte)var1;
        }
        catch (Exception ex)
        {
            return  -1;
        }
    }

    public static  int WriteBlock(BufferedOutputStream out, byte[]buff)
    {
        return  WriteBlock( out, buff, 0, buff.length);
    }


    public static  int WriteBlock(BufferedOutputStream out, byte[]buff, int offset, int len)
    {
        if( out == null)
            return -1;
        if( buff == null)
            return  0;
        if( buff.length < offset + len )
            len = buff.length - offset;

        try {
            out.write(buff, offset, len);
            out.flush();
            return len;
        }
        catch (IOException ioe)
        {
            Log.d("GOND", "relay WriteBlock IOException ioe = " + ioe);
            return  -1;
        }
    }
    public static int ReadBlock(BufferedInputStream _is, int _length, byte[] buff, int offset)
    {
        int count = 0;
        try {
            if(_length < buff.length -offset)
                count = _is.read(buff, offset, _length);
            else
                count = _is.read(buff, offset, buff.length -offset);
        }
        catch (SocketTimeoutException tm)
        {
            return  0;
        }
        catch (IOException e) {


            count = -1;// socket failed

        }
        return  count;
    }
    public  static  byte[] MsgBuffer( char cmdid, byte[] data)
    {
        byte[] b_cmdid = CharToByteArrayOfC( cmdid);
        int msg_len = 2;//2 bytes for command ID
        //msg_len += 4;// 4 bytes for msg len
        if( data != null && data.length > 0)
        {
            msg_len += data.length;
        }
        byte[] buff = new byte[msg_len + 4];
        byte[] tmp = IntToByteArrayOfC( msg_len);
        System.arraycopy( tmp  , 0, buff, 0, Integer.BYTES);

        System.arraycopy( b_cmdid , 0, buff, Integer.BYTES, b_cmdid.length );

        if( data != null && data.length > 0){
            System.arraycopy(data, 0, buff, Character.BYTES + Integer.BYTES, data.length);
        }
        return buff;
    }
}
