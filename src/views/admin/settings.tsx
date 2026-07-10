"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Switch } from "@/components/admin/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { User, Mail, Bell, Globe, Shield, Key, Save, Trash2, Download, Upload, Smartphone, Eye, CreditCard, Database, Zap, CheckCircle2, X } from "lucide-react";
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      }
    }, 'image/jpeg');
  });
};

const Settings = () => {
    const [name, setName] = useState("REOVANA Admin")
    const [email, setEmail] = useState("admin@reovana.com")
    const [language, setLanguage] = useState("en")
    const [timezone, setTimezone] = useState("utc")

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [pushNotifications, setPushNotifications] = useState(true)
    const [productUpdates, setProductUpdates] = useState(false)
    const [securityAlerts, setSecurityAlerts] = useState(true)

    // Privacy settings
    const [twoFactorAuth, setTwoFactorAuth] = useState(false)
    const [dataSharing, setDataSharing] = useState(false)

    // Photo upload states
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [showCropDialog, setShowCropDialog] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const handleSaveProfile = () => {}

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            // Check file type
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
                alert('Please select a valid image file (JPG, PNG or GIF)');
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
                setShowCropDialog(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropConfirm = async () => {
        if (imageSrc && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
                setProfileImage(croppedImage);
                setShowCropDialog(false);
                setImageSrc(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleCropCancel = () => {
        setShowCropDialog(false);
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Site Settings</h1>
                    <p className="text-sm sm:text-base text-white/50 mt-1">REOVANA admin profile, alerts, and marketplace display options</p>
                </div>
                <Button className="bg-linear-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white shadow-lg w-full sm:w-auto">
                    <Save className="h-4 w-4" /> Save All Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-white mb-1">Admin Profile</CardTitle>
                                    <CardDescription>REOVANA operations team contact</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="flex items-center gap-4">
                                    {profileImage ? (
                                        <img 
                                            src={profileImage} 
                                            alt="Profile" 
                                            className="h-20 w-20 rounded-full object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-linear-to-br from-primary to-sidebar-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                            RA
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            id="photo-upload"
                                            accept="image/jpeg,image/jpg,image/png,image/gif"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="border-primary/30 hover:bg-primary/10"
                                            onClick={() => document.getElementById('photo-upload')?.click()}
                                        >
                                            <Upload className="h-4 w-4" /> Upload Photo
                                        </Button>
                                        <p className="text-xs text-white/50">JPG, PNG or GIF. Max 10MB</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                                        <Input id="name" value={name} placeholder="Your full name..." onChange={(e) => setName(e.target.value)} required/>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                                        <Input id="email" type="email" placeholder="Your email address..." value={email} onChange={(e) => setEmail(e.target.value)} required/>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                                        <Input id="phone" type="number" placeholder="+1 (555) 000-0000" required/>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="company" className="text-slate-300">Organization</Label>
                                        <Input id="company" defaultValue="REOVANA Operations" placeholder="Team or agency name..." required/>
                                    </div>
                                </div>

                                <Button type="submit" onClick={handleSaveProfile} className="w-full md:w-auto bg-linear-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white">
                                    <Save className="h-4 w-4" /> Save Profile
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Language & Region */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Globe className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-white mb-1">Language & Region</CardTitle>
                                    <CardDescription>Set your language and timezone preferences</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="language" className="text-slate-300">Language</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger id="language">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="de">Deutsch</SelectItem>
                                            <SelectItem value="zh">中文</SelectItem>
                                            <SelectItem value="ja">日本語</SelectItem>
                                            <SelectItem value="hi">हिन्दी</SelectItem>
                                            <SelectItem value="ar">العربية</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timezone" className="text-slate-300">Timezone</Label>
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger id="timezone">
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                                            <SelectItem value="est">Eastern Time (GMT-5)</SelectItem>
                                            <SelectItem value="pst">Pacific Time (GMT-8)</SelectItem>
                                            <SelectItem value="cet">Central European (GMT+1)</SelectItem>
                                            <SelectItem value="ist">India (GMT+5:30)</SelectItem>
                                            <SelectItem value="jst">Japan (GMT+9)</SelectItem>
                                            <SelectItem value="aest">Australia Eastern (GMT+10)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <Bell className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-white mb-1">Admin Alerts</CardTitle>
                                    <CardDescription>Scraper, unlock, and subscriber notifications</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-white/50" />
                                        <div>
                                            <p className="text-base font-medium text-white">Scraper failure emails</p>
                                            <p className="text-sm text-white/50">When a data feed fails or returns zero listings</p>
                                        </div>
                                    </div>
                                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications}/>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-white/50" />
                                        <div>
                                            <p className="text-base font-medium text-white">Unlock & revenue alerts</p>
                                            <p className="text-sm text-white/50">New property unlocks and Pro signups</p>
                                        </div>
                                    </div>
                                    <Switch checked={pushNotifications} onCheckedChange={setPushNotifications}/>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Zap className="h-5 w-5 text-white/50" />
                                        <div>
                                            <p className="text-base font-medium text-white">High-traffic markets</p>
                                            <p className="text-sm text-white/50">When a state exceeds view thresholds</p>
                                        </div>
                                    </div>
                                    <Switch checked={productUpdates} onCheckedChange={setProductUpdates}/>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-white/50" />
                                        <div>
                                            <p className="text-base font-medium text-white">Security Alerts</p>
                                            <p className="text-sm text-white/50">Important security notifications</p>
                                        </div>
                                    </div>
                                    <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts}/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Quick Actions & Info */}
                <div className="space-y-6">
                    {/* Account Status */}
                    <Card className="border-green-500/20 ">
                        <CardContent className="">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-base font-medium text-white">Public site status</p>
                                    <p className="text-sm text-white/50">Live · 2,142 listings</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-white/50">
                                <div className="flex justify-between">
                                    <span>Active feeds:</span>
                                    <span className="text-white">5 of 7</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Unlock price:</span>
                                    <span className="text-green-500 font-medium">$9 / property</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pro plan:</span>
                                    <span className="text-white">$49 / month</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Billing */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-white mb-1">Marketplace pricing</CardTitle>
                                    <CardDescription>Displayed on the public REOVANA site</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-white/50" />
                                        <span className="text-sm text-white">Per unlock</span>
                                    </div>
                                    <span className="text-xs text-white/50">$9.00</span>
                                </div>
                                <p className="text-xs text-slate-500">Pro unlimited — $49/mo</p>
                            </div>
                            <Button variant="outline" className="w-full border-primary/50 hover:bg-primary/10" asChild>
                                <a href="/admin/subscription">Edit plans & billing UI</a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Security & Privacy */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <Shield className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-white mb-1">Security & Privacy</CardTitle>
                                    <CardDescription>Manage your security settings</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Key className="h-5 w-5 text-white/50" />
                                        <div>
                                            <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                                            <p className="text-xs text-white/50">Add an extra layer of security</p>
                                        </div>
                                    </div>
                                    <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth}/>
                                </div>


                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Database className="h-5 w-5 text-white/50" />
                                        <div>
                                            <p className="text-sm font-medium text-white">Blur addresses on browse</p>
                                            <p className="text-xs text-white/50">Hide full address until unlock (public site)</p>
                                        </div>
                                    </div>
                                    <Switch checked={dataSharing} onCheckedChange={setDataSharing}/>
                                </div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <Button variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10">
                                    <Key className="h-4 w-4" /> Change Password
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10">
                                    <Eye className="h-4 w-4" /> View Active Sessions
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10">
                                    <Download className="h-4 w-4" /> Download My Data
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Danger Zone */}
                    <Card className="border-red-500/40 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="text-red-400 text-sm">Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500">
                                <Trash2 className="h-4 w-4" /> Clear cache
                            </Button>
                            <p className="text-xs text-white/50">Resets local UI state only — no backend connected</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Crop Dialog */}
            <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">Crop Profile Photo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative h-96 bg-black rounded-lg overflow-hidden">
                            {imageSrc && (
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-white/50 min-w-20">Zoom:</label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-sm text-white/50 min-w-12">{Math.round(zoom * 100)}%</span>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={handleCropCancel}>
                                <X /> Cancel
                            </Button>
                            <Button className="text-white" onClick={handleCropConfirm}>
                                <CheckCircle2/> Apply Crop
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Settings;