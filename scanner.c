#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <dirent.h>
#include <linux/input.h>
#include <linux/input-event-codes.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/select.h>
#include <sys/time.h>
#include <termios.h>
#include <signal.h>

#define KEYMAP_SIZE 256
char keymap[KEYMAP_SIZE];
char shiftmap[KEYMAP_SIZE];

void initKeymap(){
    memset(keymap,0,KEYMAP_SIZE);
    memset(shiftmap,0,KEYMAP_SIZE);

keymap[KEY_RESERVED                 ] =   0;        
keymap[KEY_ESC                      ] =   0;        
keymap[KEY_1                        ] =   '1';        
keymap[KEY_2                        ] =   '2';        
keymap[KEY_3                        ] =   '3';        
keymap[KEY_4                        ] =   '4';        
keymap[KEY_5                        ] =   '5';        
keymap[KEY_6                        ] =   '6';        
keymap[KEY_7                        ] =   '7';        
keymap[KEY_8                        ] =   '8';        
keymap[KEY_9                        ] =   '9';        
keymap[KEY_0                        ] =   '0';        
keymap[KEY_MINUS                    ] =   '-';        
keymap[KEY_EQUAL                    ] =   '=';        
keymap[KEY_BACKSPACE                ] =   '\\';        
keymap[KEY_TAB                      ] =   9;        
keymap[KEY_Q                        ] =   'q';        
keymap[KEY_W                        ] =   'w';        
keymap[KEY_E                        ] =   'e';        
keymap[KEY_R                        ] =   'r';        
keymap[KEY_T                        ] =   't';        
keymap[KEY_Y                        ] =   'y';        
keymap[KEY_U                        ] =   'u';        
keymap[KEY_I                        ] =   'i';        
keymap[KEY_O                        ] =   'o';        
keymap[KEY_P                        ] =   'p';        
keymap[KEY_LEFTBRACE                ] =   '[';        
keymap[KEY_RIGHTBRACE               ] =   ']';        
keymap[KEY_ENTER                    ] =   13;        
keymap[KEY_LEFTCTRL                 ] =   17;        
keymap[KEY_A                        ] =   'a';        
keymap[KEY_S                        ] =   's';        
keymap[KEY_D                        ] =   'd';        
keymap[KEY_F                        ] =   'f';        
keymap[KEY_G                        ] =   'g';        
keymap[KEY_H                        ] =   'h';        
keymap[KEY_J                        ] =   'j';        
keymap[KEY_K                        ] =   'k';        
keymap[KEY_L                        ] =   'l';        
keymap[KEY_SEMICOLON                ] =   ';';        
keymap[KEY_APOSTROPHE               ] =   '^';        
keymap[KEY_GRAVE                    ] =   0;        
keymap[KEY_LEFTSHIFT                ] =   0;        
keymap[KEY_BACKSLASH                ] =   '\\';        
keymap[KEY_Z                        ] =   'z';        
keymap[KEY_X                        ] =   'x';        
keymap[KEY_C                        ] =   'c';        
keymap[KEY_V                        ] =   'v';        
keymap[KEY_B                        ] =   'b';        
keymap[KEY_N                        ] =   'n';        
keymap[KEY_M                        ] =   'm';        
keymap[KEY_COMMA                    ] =   ',';        
keymap[KEY_DOT                      ] =   '.';        
keymap[KEY_SLASH                    ] =   '/';        
keymap[KEY_RIGHTSHIFT               ] =   0;        
keymap[KEY_KPASTERISK               ] =   '*';        
keymap[KEY_LEFTALT                  ] =   0;        
keymap[KEY_SPACE                    ] =   ' ';    


shiftmap[KEY_COMMA] =   '<';
shiftmap[KEY_DOT] =   '>';
shiftmap[KEY_SLASH] =   '?';
shiftmap[KEY_SEMICOLON] =   ':';
shiftmap[KEY_1] =   '!';
shiftmap[KEY_2] =   '@';
shiftmap[KEY_3] =   '#';
shiftmap[KEY_4] =   '$';
shiftmap[KEY_5] =   '%';
shiftmap[KEY_6] =   '^';
shiftmap[KEY_7] =   '&';
shiftmap[KEY_8] =   '*';
shiftmap[KEY_9] =   '(';
shiftmap[KEY_0] =   ')';
shiftmap[KEY_MINUS] =   '_';
shiftmap[KEY_EQUAL] =   '=';
shiftmap[KEY_Q] =   'Q';
shiftmap[KEY_W] =   'W';
shiftmap[KEY_E] =   'E';
shiftmap[KEY_R] =   'R';
shiftmap[KEY_T] =   'T';
shiftmap[KEY_Y] =   'Y';
shiftmap[KEY_U] =   'U';
shiftmap[KEY_I] =   'I';
shiftmap[KEY_O] =   'O';
shiftmap[KEY_P] =   'P';
shiftmap[KEY_A] =   'A';
shiftmap[KEY_S] =   'S';
shiftmap[KEY_D] =   'D';
shiftmap[KEY_F] =   'F';
shiftmap[KEY_G] =   'G';
shiftmap[KEY_H] =   'H';
shiftmap[KEY_J] =   'J';
shiftmap[KEY_K] =   'K';
shiftmap[KEY_L] =   'L';
shiftmap[KEY_Z] =   'Z';
shiftmap[KEY_X] =   'X';
shiftmap[KEY_C] =   'C';
shiftmap[KEY_V] =   'V';
shiftmap[KEY_B] =   'B';
shiftmap[KEY_N] =   'N';
shiftmap[KEY_M] =   'M';
shiftmap[KEY_LEFTBRACE                ] =   '{';        
shiftmap[KEY_RIGHTBRACE               ] =   '}';   
}

#define KEYBUFF_SIZE    4000
int main(int argc, char* argv[])
{
    struct input_event ev[64];
    int fevdev = -1;
    int result = 0;
    int size = sizeof(struct input_event);
    int rd;
    int value;
    char name[256] = "Unknown";
    char *device = 0;
    int i=0;
    int keyCount = 0;
    int shift = 0;
    char c;
    char *charBuff = calloc(KEYBUFF_SIZE,sizeof(char));
    char *pChar = charBuff;

    initKeymap();

    char devPathBuff[256];
    sprintf(devPathBuff,"/dev/input/event%s",argv[1]);
    device = devPathBuff;

    fevdev = open(device, O_RDONLY);
    if (fevdev == -1) {
        printf("Failed to open event device.\n");
        exit(1);
    }

    result = ioctl(fevdev, EVIOCGNAME(sizeof(name)), name);
    printf ("Reading From : %s (%s)\n", device, name);

    printf("Getting exclusive access: ");
    result = ioctl(fevdev, EVIOCGRAB, 1);
    printf("%s\n", (result == 0) ? "SUCCESS" : "FAILURE");

    while (1)
    {
        if ((rd = read(fevdev, ev, size * 64)) < size) {
            break;
        }
        keyCount = rd/size;

        //printf("read key count: %d\n",keyCount);
        for(i=0;i<keyCount;i++){
            //printf("\tev[i].type=%d,code=%d,value=%d\n",ev[i].type,ev[i].code,ev[i].value);
            if(ev[i].type == 4){
                //dont know what it means
                ;
            }else if(ev[i].type == 1){
                //key
                if(ev[i].value == 1){
                    //press
                    if(ev[i].code == 42){
                        //shift
                        shift = 1;
                    }else{
                        //character
                        if(ev[i].code == 28){
                            //enter
                            *pChar = 0;
                            pChar = charBuff;
                            printf("ok: %s\n",pChar);
                        }else{
                            //normal character
                            if(shift){
                                *pChar = shiftmap[ev[i].code];
                            }else{
                                *pChar = keymap[ev[i].code];
                            }

                            //printf("\t[%c]|",*pChar);
                            pChar++;
                        }
                    }
                }else{
                    //release
                    shift = 0;
                    //printf("\n");
                }
            }else if(ev[i].type == 0){
                //dont know what it means
                ;
            }
            //
        }
        
    }

    printf("Exiting.\n");
    result = ioctl(fevdev, EVIOCGRAB, 1);
    close(fevdev);
    return 0;
}